import { parsePaymentOption } from "@/constants/payment-options";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/** Customer responds to counter-offer from vendor */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "No customer profile" }, { status: 400 });
  }

  const body = (await req.json()) as { action?: "accept_counter" | "decline_counter" };
  const bid = await prisma.bid.findFirst({
    where: { id: params.id, customerId: profile.id },
  });

  if (!bid) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.action === "accept_counter") {
    if (bid.status !== "COUNTER_OFFERED" || bid.counterPrice == null) {
      return NextResponse.json({ error: "No counter offer to accept" }, { status: 400 });
    }
    const qty = bid.quantity;
    const unit = bid.counterPrice;
    const total = Math.round(qty * unit * 100) / 100;
    const payHrs = parsePaymentOption(bid.paymentOption) !== "FULL" ? 24 : 72;
    await prisma.bid.update({
      where: { id: bid.id },
      data: {
        status: "APPROVED",
        bidPricePerUnit: unit,
        totalBidAmount: total,
        counterPrice: null,
        expiresAt: new Date(Date.now() + payHrs * 60 * 60 * 1000),
      },
    });
    return NextResponse.json({ ok: true, status: "APPROVED" as const });
  }

  if (body.action === "decline_counter") {
    if (bid.status !== "COUNTER_OFFERED") {
      return NextResponse.json({ error: "Invalid state" }, { status: 400 });
    }
    await prisma.bid.update({
      where: { id: bid.id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json({ ok: true, status: "CANCELLED" as const });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
