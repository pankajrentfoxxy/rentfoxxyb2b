import { getPaymentOptionConfig, type PaymentOptionId } from "@/constants/payment-options";
import { asasInventoryCap, asasUnitsAvailable } from "@/lib/asas-inventory";
import { auth } from "@/lib/auth";
import {
  asAsPurchasePricing,
  checkoutReference,
  lotPayNowAmount,
  parsePayOpt,
} from "@/lib/lot-asas-checkout";
import { allowInstantPaymentBypass, getRazorpayKeyForClient, isRazorpayConfigured } from "@/lib/payment-env";
import { prisma } from "@/lib/prisma";
import { getRazorpay } from "@/lib/razorpay";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function demoComplete(profileId: string, asasId: string, quantity: number): Promise<NextResponse> {
  const listing = await prisma.asAsListing.findFirst({
    where: { id: asasId, status: "LIVE" },
    include: { items: { select: { count: true } } },
  });
  if (!listing) return NextResponse.json({ error: "Listing not available" }, { status: 400 });
  const cap = asasInventoryCap(listing, listing.items);
  const remaining = asasUnitsAvailable(listing, listing.items);
  if (quantity > remaining) return NextResponse.json({ error: "Not enough units" }, { status: 400 });

  const gst = asAsPurchasePricing(listing.avgUnitPrice, quantity);
  const amountPaid = gst.total;
  const newSold = listing.unitsSold + quantity;

  const purchase = await prisma.$transaction(async (tx) => {
    const p = await tx.asAsPurchase.create({
      data: {
        reference: checkoutReference("AS"),
        asasId: listing.id,
        customerId: profileId,
        quantity,
        amountPaid,
        status: "PAID",
        paymentOption: "FULL",
        subtotal: gst.subtotal,
        gstAmount: gst.gstAmount,
        grandTotal: gst.total,
      },
    });
    await tx.asAsListing.update({
      where: { id: listing.id },
      data: {
        totalUnits: cap,
        unitsSold: newSold,
        status: newSold >= cap ? "SOLD_OUT" : "LIVE",
      },
    });
    return p;
  });

  return NextResponse.json({
    ok: true,
    demo: true,
    purchaseId: purchase.id,
    reference: purchase.reference,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await prisma.customerProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return NextResponse.json({ error: "No customer profile" }, { status: 400 });

  const body = (await req.json()) as {
    asasId?: string;
    quantity?: number;
    checkout?: boolean;
    addressId?: string;
    paymentOption?: string;
    customerGstin?: string | null;
  };

  const asasId = body.asasId?.trim();
  const quantity = Math.max(1, Math.floor(Number(body.quantity ?? 1)));
  const checkout = body.checkout === true;
  const paymentOption: PaymentOptionId = parsePayOpt(body.paymentOption);

  if (!asasId) return NextResponse.json({ error: "asasId required" }, { status: 400 });

  const listing = await prisma.asAsListing.findFirst({
    where: { id: asasId, status: "LIVE" },
    include: { items: { select: { count: true } } },
  });
  if (!listing) return NextResponse.json({ error: "Listing not available" }, { status: 400 });

  const remaining = asasUnitsAvailable(listing, listing.items);
  if (quantity > remaining) {
    return NextResponse.json({ error: "Not enough units" }, { status: 400 });
  }

  if (!checkout) {
    if (process.env.NODE_ENV === "production" && !allowInstantPaymentBypass()) {
      return NextResponse.json({ error: "Use checkout flow (checkout: true)." }, { status: 400 });
    }
    return demoComplete(profile.id, asasId, quantity);
  }

  if (!body.addressId?.trim()) {
    return NextResponse.json({ error: "addressId required" }, { status: 400 });
  }

  const address = await prisma.address.findFirst({
    where: { id: body.addressId.trim(), userId: session.user.id },
  });
  if (!address) return NextResponse.json({ error: "Invalid address" }, { status: 400 });

  const gst = asAsPurchasePricing(listing.avgUnitPrice, quantity);
  const chargeTotal = lotPayNowAmount(gst.total, paymentOption);
  const cfg = getPaymentOptionConfig(paymentOption);
  const balanceDueAt =
    paymentOption !== "FULL" ? new Date(Date.now() + cfg.windowHours * 3600 * 1000) : null;

  const configured = isRazorpayConfigured();
  const bypass = allowInstantPaymentBypass();
  const reference = checkoutReference("AS");

  const purchase = await prisma.asAsPurchase.create({
    data: {
      reference,
      asasId: listing.id,
      customerId: profile.id,
      addressId: address.id,
      quantity,
      amountPaid: 0,
      status: "PENDING_PAYMENT",
      paymentOption,
      subtotal: gst.subtotal,
      gstAmount: gst.gstAmount,
      grandTotal: gst.total,
      tokenAmount: paymentOption !== "FULL" ? chargeTotal : null,
      balanceDueAt,
      customerGstin: body.customerGstin?.trim() || undefined,
    },
  });

  if (!configured && bypass) {
    return NextResponse.json({
      devMode: true,
      purchaseId: purchase.id,
      purchaseReference: purchase.reference,
      razorpayOrderId: null,
      amount: chargeTotal,
      amountPaise: Math.round(chargeTotal * 100),
      grandTotal: gst.total,
      paymentOption,
      tokenFlow: paymentOption !== "FULL",
      totalWithGst: gst.total,
      message: "PAYMENT_DEV_BYPASS=true — use verify with devBypass.",
    });
  }

  if (!configured) {
    await prisma.asAsPurchase.delete({ where: { id: purchase.id } });
    return NextResponse.json(
      { error: "Configure Razorpay keys or PAYMENT_DEV_BYPASS=true locally." },
      { status: 503 },
    );
  }

  const rzp = getRazorpay();
  const rzpOrder = await rzp.orders.create({
    amount: Math.round(chargeTotal * 100),
    currency: "INR",
    receipt: purchase.id.slice(0, 20),
    notes: { asasPurchaseId: purchase.id, purpose: paymentOption === "FULL" ? "FULL" : "TOKEN" },
  });

  await prisma.asAsPurchase.update({
    where: { id: purchase.id },
    data: { razorpayOrderId: rzpOrder.id },
  });

  return NextResponse.json({
    purchaseId: purchase.id,
    purchaseReference: purchase.reference,
    razorpayOrderId: rzpOrder.id,
    amount: chargeTotal,
    amountPaise: rzpOrder.amount,
    grandTotal: gst.total,
    totalWithGst: gst.total,
    paymentOption,
    tokenFlow: paymentOption !== "FULL",
    currency: rzpOrder.currency,
    key: getRazorpayKeyForClient(),
  });
}
