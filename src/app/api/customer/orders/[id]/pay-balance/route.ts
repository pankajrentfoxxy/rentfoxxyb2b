import { auth } from "@/lib/auth";
import { roundMoney } from "@/constants/payment-options";
import { allowInstantPaymentBypass, getRazorpayKeyForClient, isRazorpayConfigured } from "@/lib/payment-env";
import { getRazorpay } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: orderId } = await ctx.params;

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "No profile" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: profile.id },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (order.status !== "TOKEN_PAID") {
    return NextResponse.json({ error: "No balance payment due for this order" }, { status: 400 });
  }

  if (order.balanceDueAt && order.balanceDueAt < new Date()) {
    return NextResponse.json({ error: "Balance deadline has passed" }, { status: 400 });
  }

  const token = order.tokenAmount ?? 0;
  const balanceAmount = roundMoney(order.totalAmount - token);
  if (balanceAmount <= 0) {
    return NextResponse.json({ error: "Nothing to pay" }, { status: 400 });
  }

  const configured = isRazorpayConfigured();
  const bypass = allowInstantPaymentBypass();
  if (!configured && !bypass) {
    return NextResponse.json(
      {
        error:
          "Add Razorpay keys for balance payment, or set PAYMENT_DEV_BYPASS=true for local simulation only.",
      },
      { status: 503 },
    );
  }

  if (!configured && bypass) {
    return NextResponse.json({
      devMode: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: balanceAmount,
      amountPaise: Math.round(balanceAmount * 100),
      message: "PAYMENT_DEV_BYPASS=true — skipping Razorpay.",
    });
  }

  const rzp = getRazorpay();
  const rzpOrder = await rzp.orders.create({
    amount: Math.round(balanceAmount * 100),
    currency: "INR",
    receipt: `bal_${order.id.slice(0, 16)}`,
    notes: { orderId: order.id, purpose: "BALANCE" },
  });

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.orderNumber,
    razorpayOrderId: rzpOrder.id,
    amount: balanceAmount,
    amountPaise: rzpOrder.amount,
    currency: rzpOrder.currency,
    key: getRazorpayKeyForClient(),
  });
}
