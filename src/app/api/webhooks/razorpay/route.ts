import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * Keeps Payment rows in sync when Razorpay sends server events.
 * Order status transitions are applied via `/api/customer/payments/verify` to avoid conflicting
 * paths for token vs full vs balance flows.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const raw = await req.text();
  if (secret) {
    const sig = req.headers.get("x-razorpay-signature");
    if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (expected !== sig) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }
  }

  let evt: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; status?: string } } } };
  try {
    evt = JSON.parse(raw) as typeof evt;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pay = evt.payload?.payment?.entity;
  if (!pay?.order_id) return NextResponse.json({ ok: true });

  const row = await prisma.payment.findFirst({
    where: { razorpayOrderId: pay.order_id },
  });

  if (!row) return NextResponse.json({ ok: true });

  if (evt.event === "payment.captured" || pay.status === "captured") {
    await prisma.payment.update({
      where: { id: row.id },
      data: {
        razorpayPaymentId: pay.id ?? row.razorpayPaymentId,
        status: "captured",
        paidAt: new Date(),
      },
    });
  }

  if (evt.event === "payment.failed") {
    await prisma.payment.update({
      where: { id: row.id },
      data: { status: "failed" },
    });
  }

  return NextResponse.json({ received: true });
}

export const dynamic = "force-dynamic";
