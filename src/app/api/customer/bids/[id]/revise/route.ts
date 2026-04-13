import { auth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_REVISIONS = 5;

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.customerProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 400 });

  const { id } = await params;
  const body = (await req.json()) as { newBidPrice?: number; note?: string };
  const newBidPrice = Number(body.newBidPrice);
  if (!Number.isFinite(newBidPrice) || newBidPrice <= 0) {
    return NextResponse.json({ error: "newBidPrice required" }, { status: 400 });
  }

  const bid = await prisma.bid.findFirst({
    where: { id, customerId: profile.id },
    include: { listing: true },
  });
  if (!bid) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!["REJECTED", "COUNTER_OFFERED", "EXPIRED"].includes(bid.status)) {
    return NextResponse.json({ error: "Bid cannot be revised in this state" }, { status: 400 });
  }
  if (bid.revisionCount >= MAX_REVISIONS) {
    return NextResponse.json({ error: "Maximum revisions reached" }, { status: 400 });
  }

  const history = (bid.revisionHistory as { at: string; oldPrice: number; newPrice: number; note?: string; actor: string }[]) ?? [];
  history.push({
    at: new Date().toISOString(),
    oldPrice: bid.bidPricePerUnit,
    newPrice: newBidPrice,
    note: body.note?.trim() || undefined,
    actor: "CUSTOMER",
  });

  const updated = await prisma.bid.update({
    where: { id: bid.id },
    data: {
      bidPricePerUnit: newBidPrice,
      totalBidAmount: newBidPrice * bid.quantity,
      status: "PENDING",
      vendorNote: null,
      counterPrice: null,
      expiresAt: null,
      revisionCount: { increment: 1 },
      revisionHistory: history,
    },
  });

  const v = await prisma.vendorProfile.findUnique({
    where: { id: bid.listing.vendorId },
    select: { userId: true },
  });
  if (v) {
    await createNotification({
      userId: v.userId,
      type: "BID_REVISED",
      title: "Customer revised a bid",
      message: `New price ₹${newBidPrice.toLocaleString("en-IN")}/unit for ${bid.listing.sku}.`,
      link: `/vendor/bids/${bid.id}`,
    });
  }

  return NextResponse.json({ success: true, bid: updated });
}
