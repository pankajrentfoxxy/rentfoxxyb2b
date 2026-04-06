import { auth } from "@/lib/auth";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.customerProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return NextResponse.json({ error: "No customer profile" }, { status: 400 });

  const body = (await req.json()) as {
    lotId?: string;
    lotsCount?: number;
    bidPricePerLot?: number;
    paymentOption?: string;
    note?: string;
  };

  const lotId = body.lotId?.trim();
  const lotsCount = Math.max(1, Math.floor(Number(body.lotsCount ?? 1)));
  const bidPricePerLot = Number(body.bidPricePerLot);
  const paymentOption = body.paymentOption?.trim() || "FULL";
  const note = body.note?.trim()?.slice(0, 300) ?? null;

  if (!lotId || !Number.isFinite(bidPricePerLot)) {
    return NextResponse.json({ error: "lotId and bidPricePerLot required" }, { status: 400 });
  }

  const lot = await prisma.lotListing.findFirst({
    where: { id: lotId, status: "LIVE" },
  });
  if (!lot) return NextResponse.json({ error: "Lot not available" }, { status: 400 });

  const remaining = lot.totalLots - lot.lotsSold;
  if (lotsCount > remaining) {
    return NextResponse.json({ error: "Not enough lots available" }, { status: 400 });
  }

  const floor = lot.pricePerLot * 0.5;
  if (bidPricePerLot < floor) {
    return NextResponse.json(
      { error: `Bid must be at least ₹${Math.ceil(floor).toLocaleString("en-IN")} per lot (50% of list)` },
      { status: 400 },
    );
  }

  const bid = await prisma.lotBid.create({
    data: {
      customerId: profile.id,
      lotId,
      lotsCount,
      bidPricePerLot,
      totalBidAmount: round2(lotsCount * bidPricePerLot),
      paymentOption,
      note,
      status: "PENDING",
    },
  });

  const admins = await prisma.user.findMany({ where: { role: Role.ADMIN }, select: { id: true } });
  await Promise.all(
    admins.map((u) =>
      createNotification({
        userId: u.id,
        type: NOTIFICATION_TYPES.BID_SUBMITTED,
        title: "Lot price bid received",
        message: `Customer bid on "${lot.title}": ${lotsCount} lot(s) @ ₹${bidPricePerLot.toLocaleString("en-IN")}/lot`,
        link: `/admin/lots/${lotId}`,
      }),
    ),
  );

  return NextResponse.json({ success: true, bidId: bid.id });
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
