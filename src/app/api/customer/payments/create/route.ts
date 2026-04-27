import { auth } from "@/lib/auth";
import { getPaymentOptionConfig, parsePaymentOption, roundMoney, type PaymentOptionId } from "@/constants/payment-options";
import { gstBreakdown } from "@/lib/gst";
import { allowInstantPaymentBypass, getRazorpayKeyForClient, isRazorpayConfigured } from "@/lib/payment-env";
import { nextOrderNumber } from "@/lib/order-utils";
import { prisma } from "@/lib/prisma";
import { validateCartVendorPayments, validateVendorBidPayment } from "@/lib/vendor-payment-rules";
import { getRazorpay } from "@/lib/razorpay";
import type { CartLine } from "@/types/cart";
import { NextRequest, NextResponse } from "next/server";

type DeliverySplit = { addressId: string; quantity: number; label?: string };

type CreateBody = {
  addressId: string;
  items?: CartLine[];
  bidId?: string;
  customerGstin?: string;
  /** Optional: split cart quantity across multiple saved addresses (cart only). */
  deliverySplits?: DeliverySplit[];
};

const vendorPaySelect = {
  acceptedPaymentMethods: true,
  requiresFullAdvance: true,
  minOrderForRTGS: true,
  minTokenPercentage: true,
  acceptsTokenPayment: true,
} as const;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as CreateBody;
  if (!body.addressId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "No customer profile" }, { status: 400 });
  }

  const address = await prisma.address.findFirst({
    where: { id: body.addressId, userId: session.user.id },
  });
  if (!address) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const lines: { listingId: string; quantity: number; unitPrice: number; subtotal: number }[] = [];
  let subtotalExGst = 0;
  let bidIdForOrder: string | undefined;
  let paymentOption: PaymentOptionId = "FULL";

  if (body.bidId) {
    const bid = await prisma.bid.findFirst({
      where: {
        id: body.bidId,
        customerId: profile.id,
        status: "APPROVED",
      },
      include: { listing: { include: { vendor: { select: vendorPaySelect } } } },
    });
    if (!bid) {
      return NextResponse.json({ error: "Bid not payable" }, { status: 400 });
    }
    if (bid.expiresAt && bid.expiresAt < new Date()) {
      return NextResponse.json({ error: "Bid offer expired" }, { status: 400 });
    }
    if (bid.listing.stockQty < bid.quantity) {
      return NextResponse.json({ error: "Insufficient stock for this bid" }, { status: 400 });
    }
    const existingOrder = await prisma.order.findUnique({ where: { bidId: bid.id } });
    if (existingOrder) {
      return NextResponse.json({ error: "Order already created for this bid" }, { status: 409 });
    }

    paymentOption = parsePaymentOption(bid.paymentOption);
    const bidCheck = validateVendorBidPayment({
      vendor: bid.listing.vendor,
      paymentOption,
      bidSubtotalExGst: bid.totalBidAmount,
    });
    if (!bidCheck.ok) {
      return NextResponse.json({ error: bidCheck.error }, { status: 400 });
    }

    subtotalExGst = bid.totalBidAmount;
    lines.push({
      listingId: bid.listingId,
      quantity: bid.quantity,
      unitPrice: bid.bidPricePerUnit,
      subtotal: bid.totalBidAmount,
    });
    bidIdForOrder = bid.id;
  } else if (Array.isArray(body.items) && body.items.length > 0) {
    bidIdForOrder = undefined;
    const cartVendorLines: {
      subtotalExGst: number;
      vendorId: string;
      vendor: {
        acceptedPaymentMethods: string[];
        requiresFullAdvance: boolean;
        minOrderForRTGS: number | null;
        minTokenPercentage: number;
        acceptsTokenPayment: boolean;
      };
    }[] = [];

    for (const item of body.items) {
      const listing = await prisma.productListing.findFirst({
        where: { id: item.listingId, isActive: true },
        include: { vendor: { select: vendorPaySelect } },
      });
      if (!listing || item.quantity > listing.stockQty || item.quantity < listing.minOrderQty) {
        return NextResponse.json({ error: "Cart item invalid or out of stock" }, { status: 400 });
      }
      if (Math.abs(listing.unitPrice - item.unitPrice) > 0.01) {
        return NextResponse.json(
          { error: "Prices have changed. Refresh your cart." },
          { status: 409 },
        );
      }
      const sub = Math.round(item.quantity * listing.unitPrice * 100) / 100;
      lines.push({
        listingId: listing.id,
        quantity: item.quantity,
        unitPrice: listing.unitPrice,
        subtotal: sub,
      });
      subtotalExGst += sub;
      cartVendorLines.push({
        subtotalExGst: sub,
        vendorId: listing.vendorId,
        vendor: listing.vendor,
      });
    }

    const cartCheck = validateCartVendorPayments(cartVendorLines);
    if (!cartCheck.ok) {
      return NextResponse.json({ error: cartCheck.error }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "Provide items or bidId" }, { status: 400 });
  }

  let isMultiAddress = false;
  let deliveryCreates: { addressId: string; quantity: number; label: string | null }[] | undefined;

  if (body.deliverySplits && body.deliverySplits.length > 0) {
    if (bidIdForOrder) {
      return NextResponse.json(
        { error: "Multi-address delivery is only available for cart checkout" },
        { status: 400 },
      );
    }
    const sumSplits = body.deliverySplits.reduce((s, d) => s + Math.floor(Number(d.quantity) || 0), 0);
    const sumLines = lines.reduce((s, l) => s + l.quantity, 0);
    if (sumSplits !== sumLines) {
      return NextResponse.json(
        { error: "Delivery quantities must match total units in the cart" },
        { status: 400 },
      );
    }
    deliveryCreates = [];
    for (const d of body.deliverySplits) {
      const q = Math.floor(Number(d.quantity) || 0);
      if (q < 1) {
        return NextResponse.json({ error: "Invalid split quantity" }, { status: 400 });
      }
      const addr = await prisma.address.findFirst({
        where: { id: d.addressId, userId: session.user.id },
      });
      if (!addr) {
        return NextResponse.json({ error: "Invalid delivery address in split" }, { status: 400 });
      }
      deliveryCreates.push({
        addressId: d.addressId,
        quantity: q,
        label: d.label?.trim() || null,
      });
    }
    isMultiAddress = deliveryCreates.length > 1;
  }

  const configured = isRazorpayConfigured();
  const bypass = allowInstantPaymentBypass();
  if (!configured && !bypass) {
    return NextResponse.json(
      {
        error:
          "Payments not configured. Add Razorpay test keys (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and NEXT_PUBLIC_RAZORPAY_KEY_ID for checkout). Or set PAYMENT_DEV_BYPASS=true only for local simulation without Razorpay.",
      },
      { status: 503 },
    );
  }

  const gst = gstBreakdown(subtotalExGst);
  const orderNumber = await nextOrderNumber();

  const payCfg = getPaymentOptionConfig(paymentOption);
  const isTokenCheckout = bidIdForOrder != null && paymentOption !== "FULL";
  const chargeTotal = isTokenCheckout
    ? roundMoney(gst.total * (payCfg.tokenPct / 100))
    : gst.total;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: profile.id,
      addressId: address.id,
      bidId: bidIdForOrder,
      subtotal: gst.subtotal,
      gstAmount: gst.gstAmount,
      totalAmount: gst.total,
      status: "PAYMENT_PENDING",
      isMultiAddress,
      deliveryAddresses:
        deliveryCreates && deliveryCreates.length > 0
          ? { create: deliveryCreates }
          : undefined,
      items: {
        create: lines.map((l) => ({
          listingId: l.listingId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          subtotal: l.subtotal,
        })),
      },
    },
  });

  if (!configured && bypass) {
    return NextResponse.json({
      devMode: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountPaise: Math.round(chargeTotal * 100),
      amount: chargeTotal,
      totalWithGst: gst.total,
      paymentOption,
      tokenFlow: isTokenCheckout,
      message: "PAYMENT_DEV_BYPASS=true — skipping Razorpay. Do not use in production.",
    });
  }

  const rzp = getRazorpay();
  const rzpOrder = await rzp.orders.create({
    amount: Math.round(chargeTotal * 100),
    currency: "INR",
    receipt: order.id.slice(0, 20),
    notes: {
      orderId: order.id,
      purpose: isTokenCheckout ? "TOKEN" : "FULL",
    },
  });

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.orderNumber,
    razorpayOrderId: rzpOrder.id,
    amount: chargeTotal,
    amountPaise: rzpOrder.amount,
    totalWithGst: gst.total,
    paymentOption,
    tokenFlow: isTokenCheckout,
    currency: rzpOrder.currency,
    key: getRazorpayKeyForClient(),
  });
}
