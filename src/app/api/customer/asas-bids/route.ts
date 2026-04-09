import { asasUnitsAvailableFromPurchases } from "@/lib/asas-inventory";
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
    asasId?: string;
    quantity?: number;
    bidPricePerUnit?: number;
    paymentOption?: string;
    note?: string;
  };

  const asasId = body.asasId?.trim();
  const quantity = Math.max(1, Math.floor(Number(body.quantity ?? 1)));
  const bidPricePerUnit = Number(body.bidPricePerUnit);
  const paymentOption = body.paymentOption?.trim() || "FULL";
  const note = body.note?.trim()?.slice(0, 300) ?? null;

  if (!asasId || !Number.isFinite(bidPricePerUnit)) {
    return NextResponse.json({ error: "asasId and bidPricePerUnit required" }, { status: 400 });
  }

  const listing = await prisma.asAsListing.findFirst({
    where: { id: asasId, status: "LIVE" },
    include: {
      items: { select: { count: true } },
      purchases: { select: { quantity: true, status: true } },
    },
  });
  if (!listing) return NextResponse.json({ error: "Listing not available" }, { status: 400 });

  if (!listing.allowBidding) {
    return NextResponse.json({ error: "Bidding not enabled for this listing" }, { status: 400 });
  }

  const remaining = asasUnitsAvailableFromPurchases(listing, listing.items, listing.purchases);
  if (quantity > remaining) {
    return NextResponse.json({ error: "Not enough units available" }, { status: 400 });
  }

  const floor = listing.avgUnitPrice * 0.5;
  if (bidPricePerUnit < floor) {
    return NextResponse.json(
      { error: `Bid must be at least ₹${Math.ceil(floor).toLocaleString("en-IN")} per unit (50% of avg)` },
      { status: 400 },
    );
  }

  const bid = await prisma.asAsBid.create({
    data: {
      customerId: profile.id,
      asasId,
      quantity,
      bidPricePerUnit,
      totalBidAmount: round2(quantity * bidPricePerUnit),
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
        title: "AsAs price bid received",
        message: `Customer bid on "${listing.title}": ${quantity} units @ ₹${bidPricePerUnit.toLocaleString("en-IN")}/unit`,
        link: `/admin/asas/${asasId}`,
      }),
    ),
  );

  return NextResponse.json({ success: true, bidId: bid.id });
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
