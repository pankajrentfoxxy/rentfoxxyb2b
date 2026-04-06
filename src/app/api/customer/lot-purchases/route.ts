import { getPaymentOptionConfig, type PaymentOptionId } from "@/constants/payment-options";
import { auth } from "@/lib/auth";
import { checkoutReference, lotPayNowAmount, lotPurchasePricing, parsePayOpt } from "@/lib/lot-asas-checkout";
import { allowInstantPaymentBypass, getRazorpayKeyForClient, isRazorpayConfigured } from "@/lib/payment-env";
import { prisma } from "@/lib/prisma";
import { getRazorpay } from "@/lib/razorpay";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function getCustomerProfile(userId: string) {
  return prisma.customerProfile.findUnique({ where: { userId } });
}

/** Demo: instant completion without Razorpay (legacy). */
async function demoCompletePurchase(
  profileId: string,
  lotId: string,
  lotsCount: number,
): Promise<NextResponse> {
  const lot = await prisma.lotListing.findFirst({ where: { id: lotId, status: "LIVE" } });
  if (!lot) return NextResponse.json({ error: "Lot not available" }, { status: 400 });
  const remaining = lot.totalLots - lot.lotsSold;
  if (lotsCount > remaining) {
    return NextResponse.json({ error: "Not enough lots left" }, { status: 400 });
  }
  const totalUnits = lotsCount * lot.lotSize;
  const gst = lotPurchasePricing(lot.pricePerLot, lotsCount);
  const amountPaid = gst.total;
  const newSold = lot.lotsSold + lotsCount;

  const purchase = await prisma.$transaction(async (tx) => {
    const p = await tx.lotPurchase.create({
      data: {
        reference: checkoutReference("LP"),
        lotId: lot.id,
        customerId: profileId,
        lotsCount,
        totalUnits,
        amountPaid,
        status: "PAID",
        paymentOption: "FULL",
        subtotal: gst.subtotal,
        gstAmount: gst.gstAmount,
        grandTotal: gst.total,
      },
    });
    await tx.lotListing.update({
      where: { id: lot.id },
      data: {
        lotsSold: newSold,
        status: newSold >= lot.totalLots ? "SOLD_OUT" : "LIVE",
      },
    });
    return p;
  });

  return NextResponse.json({
    ok: true,
    demo: true,
    purchaseId: purchase.id,
    reference: purchase.reference,
    message: "Demo purchase recorded (no Razorpay).",
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await getCustomerProfile(session.user.id);
  if (!profile) return NextResponse.json({ error: "No customer profile" }, { status: 400 });

  const body = (await req.json()) as {
    lotId?: string;
    lotsCount?: number;
    checkout?: boolean;
    addressId?: string;
    paymentOption?: string;
    customerGstin?: string | null;
  };

  const lotId = body.lotId?.trim();
  const lotsCount = Math.max(1, Math.floor(Number(body.lotsCount ?? 1)));
  const checkout = body.checkout === true;
  const paymentOption: PaymentOptionId = parsePayOpt(body.paymentOption);

  if (!lotId) return NextResponse.json({ error: "lotId required" }, { status: 400 });

  const lot = await prisma.lotListing.findFirst({ where: { id: lotId, status: "LIVE" } });
  if (!lot) return NextResponse.json({ error: "Lot not available" }, { status: 400 });

  const remaining = lot.totalLots - lot.lotsSold;
  if (lotsCount > remaining) {
    return NextResponse.json({ error: "Not enough lots left" }, { status: 400 });
  }

  if (!checkout) {
    if (process.env.NODE_ENV === "production" && !allowInstantPaymentBypass()) {
      return NextResponse.json(
        { error: "Use checkout flow with address and payment (checkout: true)." },
        { status: 400 },
      );
    }
    return demoCompletePurchase(profile.id, lotId, lotsCount);
  }

  if (!body.addressId?.trim()) {
    return NextResponse.json({ error: "addressId required for checkout" }, { status: 400 });
  }

  const address = await prisma.address.findFirst({
    where: { id: body.addressId.trim(), userId: session.user.id },
  });
  if (!address) return NextResponse.json({ error: "Invalid address" }, { status: 400 });

  const totalUnits = lotsCount * lot.lotSize;
  const gst = lotPurchasePricing(lot.pricePerLot, lotsCount);
  const chargeTotal = lotPayNowAmount(gst.total, paymentOption);
  const cfg = getPaymentOptionConfig(paymentOption);
  const balanceDueAt =
    paymentOption !== "FULL" ? new Date(Date.now() + cfg.windowHours * 3600 * 1000) : null;

  const configured = isRazorpayConfigured();
  const bypass = allowInstantPaymentBypass();

  const reference = checkoutReference("LP");

  const purchase = await prisma.lotPurchase.create({
    data: {
      reference,
      lotId: lot.id,
      customerId: profile.id,
      addressId: address.id,
      lotsCount,
      totalUnits,
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
      message: "PAYMENT_DEV_BYPASS=true — use verify with devBypass to complete.",
    });
  }

  if (!configured) {
    await prisma.lotPurchase.delete({ where: { id: purchase.id } });
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
    notes: { lotPurchaseId: purchase.id, purpose: paymentOption === "FULL" ? "FULL" : "TOKEN" },
  });

  await prisma.lotPurchase.update({
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
