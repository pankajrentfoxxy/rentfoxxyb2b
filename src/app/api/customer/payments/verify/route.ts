import { auth } from "@/lib/auth";
import { getPaymentOptionConfig, parsePaymentOption, roundMoney } from "@/constants/payment-options";
import { ensureTaxInvoiceForOrder } from "@/lib/invoice-generator";
import { sendTokenPaymentConfirmationMail } from "@/lib/order-emails";
import { notifyOrderPlaced } from "@/lib/orders-notify";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { allowInstantPaymentBypass, isRazorpayConfigured } from "@/lib/payment-env";
import { prisma } from "@/lib/prisma";
import { verifyAsAsPurchasePayment, verifyLotPurchasePayment } from "@/lib/verify-lot-asas-payment";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    orderId?: string;
    purchaseType?: "LOT" | "ASAS";
    lotPurchaseId?: string;
    asasPurchaseId?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    devBypass?: boolean;
  };

  if (body.purchaseType === "LOT" && body.lotPurchaseId) {
    const r = await verifyLotPurchasePayment(body.lotPurchaseId, {
      userId: session.user.id,
      razorpay_order_id: body.razorpay_order_id,
      razorpay_payment_id: body.razorpay_payment_id,
      razorpay_signature: body.razorpay_signature,
      devBypass: body.devBypass,
    });
    if ("error" in r && r.error) {
      return NextResponse.json({ error: r.error }, { status: Number(r.httpStatus) || 400 });
    }
    const { httpStatus: _h, ...rest } = r;
    void _h;
    return NextResponse.json(rest);
  }

  if (body.purchaseType === "ASAS" && body.asasPurchaseId) {
    const r = await verifyAsAsPurchasePayment(body.asasPurchaseId, {
      userId: session.user.id,
      razorpay_order_id: body.razorpay_order_id,
      razorpay_payment_id: body.razorpay_payment_id,
      razorpay_signature: body.razorpay_signature,
      devBypass: body.devBypass,
    });
    if ("error" in r && r.error) {
      return NextResponse.json({ error: r.error }, { status: Number(r.httpStatus) || 400 });
    }
    const { httpStatus: _h2, ...rest } = r;
    void _h2;
    return NextResponse.json(rest);
  }

  if (!body.orderId) {
    return NextResponse.json({ error: "orderId or marketplace purchase required" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      id: body.orderId,
      customer: { userId: session.user.id },
      status: { in: ["PAYMENT_PENDING", "TOKEN_PAID"] },
    },
    include: { items: true, bid: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (body.devBypass) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (isRazorpayConfigured()) {
      return NextResponse.json(
        { error: "Use Razorpay checkout — test keys are configured" },
        { status: 400 },
      );
    }
    if (!allowInstantPaymentBypass()) {
      return NextResponse.json(
        {
          error:
            "Configure RAZORPAY_KEY_* and NEXT_PUBLIC_RAZORPAY_KEY_ID, or set PAYMENT_DEV_BYPASS=true for local simulation only.",
        },
        { status: 400 },
      );
    }
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  const keyMissing = !secret;

  if (keyMissing && process.env.NODE_ENV === "production" && !body.devBypass) {
    return NextResponse.json({ error: "Payment not configured" }, { status: 503 });
  }

  if (!body.devBypass) {
    if (!keyMissing && body.razorpay_order_id && body.razorpay_payment_id && body.razorpay_signature) {
      const payload = `${body.razorpay_order_id}|${body.razorpay_payment_id}`;
      const expected = crypto.createHmac("sha256", secret!).update(payload).digest("hex");
      if (expected !== body.razorpay_signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    } else if (!keyMissing) {
      return NextResponse.json({ error: "Missing Razorpay fields" }, { status: 400 });
    }
  }

  if (order.status === "TOKEN_PAID") {
    const tokenPaid = order.tokenAmount ?? 0;
    const balanceAmount = roundMoney(order.totalAmount - tokenPaid);
    const existingBal = await prisma.payment.findFirst({
      where: { orderId: order.id, paymentPurpose: "BALANCE", status: "captured" },
    });
    if (existingBal) {
      return NextResponse.json({ ok: true, orderId: order.id });
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          orderId: order.id,
          razorpayOrderId: body.razorpay_order_id ?? `dev_bal_${order.id}`,
          razorpayPaymentId: body.razorpay_payment_id ?? `dev_balpay_${order.id}`,
          amount: balanceAmount,
          status: "captured",
          paidAt: new Date(),
          paymentPurpose: "BALANCE",
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "ORDER_PLACED",
          balancePaidAt: new Date(),
        },
      });

      if (order.bidId) {
        await tx.bid.update({
          where: { id: order.bidId },
          data: { status: "PAID" },
        });
      }

      await tx.cart.upsert({
        where: { customerId: order.customerId },
        create: { customerId: order.customerId, items: [] },
        update: { items: [] },
      });
    });

    await notifyOrderPlaced(order.id);
    void ensureTaxInvoiceForOrder(order.id).catch(() => undefined);

    return NextResponse.json({ ok: true, orderId: order.id });
  }

  // PAYMENT_PENDING — initial checkout (full or token)
  const existingInitial = await prisma.payment.findFirst({
    where: {
      orderId: order.id,
      paymentPurpose: { in: ["FULL", "TOKEN"] },
      status: "captured",
    },
  });
  if (existingInitial) {
    return NextResponse.json({ ok: true, orderId: order.id });
  }

  const payOpt = parsePaymentOption(order.bid?.paymentOption);
  const cfg = getPaymentOptionConfig(payOpt);
  const isToken = payOpt !== "FULL" && order.bidId != null;

  await prisma.$transaction(async (tx) => {
    if (!isToken) {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "ORDER_PLACED" },
      });

      if (order.bidId) {
        await tx.bid.update({
          where: { id: order.bidId },
          data: { status: "PAID" },
        });
      }

      for (const item of order.items) {
        await tx.productListing.update({
          where: { id: item.listingId },
          data: { stockQty: { decrement: item.quantity } },
        });
      }

      await tx.payment.create({
        data: {
          orderId: order.id,
          razorpayOrderId: body.razorpay_order_id ?? `dev_${order.id}`,
          razorpayPaymentId: body.razorpay_payment_id ?? `dev_pay_${order.id}`,
          amount: order.totalAmount,
          status: "captured",
          paidAt: new Date(),
          paymentPurpose: "FULL",
        },
      });

      await tx.cart.upsert({
        where: { customerId: order.customerId },
        create: { customerId: order.customerId, items: [] },
        update: { items: [] },
      });
    } else {
      const tokenAmt = roundMoney(order.totalAmount * (cfg.tokenPct / 100));
      const due = new Date(Date.now() + cfg.windowHours * 3600 * 1000);

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "TOKEN_PAID",
          tokenAmount: tokenAmt,
          tokenPercentage: cfg.tokenPct,
          tokenPaidAt: new Date(),
          balanceDueAt: due,
        },
      });

      for (const item of order.items) {
        await tx.productListing.update({
          where: { id: item.listingId },
          data: { stockQty: { decrement: item.quantity } },
        });
      }

      await tx.payment.create({
        data: {
          orderId: order.id,
          razorpayOrderId: body.razorpay_order_id ?? `dev_tok_${order.id}`,
          razorpayPaymentId: body.razorpay_payment_id ?? `dev_tokpay_${order.id}`,
          amount: tokenAmt,
          status: "captured",
          paidAt: new Date(),
          paymentPurpose: "TOKEN",
        },
      });

      await tx.cart.upsert({
        where: { customerId: order.customerId },
        create: { customerId: order.customerId, items: [] },
        update: { items: [] },
      });
    }
  });

  if (!isToken) {
    await notifyOrderPlaced(order.id);
    void ensureTaxInvoiceForOrder(order.id).catch(() => undefined);
  } else {
    const o = await prisma.order.findUnique({
      where: { id: order.id },
      include: { customer: { include: { user: true } } },
    });
    if (o?.customer.userId) {
      const bal = roundMoney(o.totalAmount - (o.tokenAmount ?? 0));
      await createNotification({
        userId: o.customer.userId,
        type: NOTIFICATION_TYPES.TOKEN_RECEIVED,
        title: "Token received — stock reserved",
        message: `Pay balance ₹${bal.toLocaleString("en-IN")} by ${(o.balanceDueAt ?? new Date()).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}.`,
        link: `/customer/orders/${o.id}`,
      });
      void sendTokenPaymentConfirmationMail(o.id);
    }
  }

  const refreshed = await prisma.order.findUnique({ where: { id: order.id } });
  const nextStep =
    refreshed?.status === "TOKEN_PAID" ? ("BALANCE_PAYMENT" as const) : ("COMPLETE" as const);
  const balanceDueAt = refreshed?.balanceDueAt?.toISOString() ?? null;
  const balanceAmount =
    refreshed?.status === "TOKEN_PAID"
      ? roundMoney((refreshed.totalAmount ?? 0) - (refreshed.tokenAmount ?? 0))
      : null;

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    nextStep,
    balanceDueAt,
    balanceAmount,
  });
}
