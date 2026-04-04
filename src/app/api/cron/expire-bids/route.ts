import { NOTIFICATION_TYPES } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function authCron(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const expired = await prisma.bid.findMany({
    where: {
      status: "APPROVED",
      expiresAt: { lt: now },
    },
    include: { customer: { select: { userId: true } }, listing: { include: { product: true } } },
  });

  let count = 0;
  for (const bid of expired) {
    const hasOrder = await prisma.order.findUnique({
      where: { bidId: bid.id },
      select: { id: true },
    });
    if (hasOrder) continue;

    await prisma.$transaction([
      prisma.bid.update({
        where: { id: bid.id },
        data: { status: "EXPIRED" },
      }),
      prisma.notification.create({
        data: {
          userId: bid.customer.userId,
          type: NOTIFICATION_TYPES.BID_EXPIRED,
          title: "Bid offer expired",
          message: `Payment window ended for ${bid.listing.product.name}. You can place a new bid if stock is still available.`,
          link: `/customer/bids/${bid.id}`,
        },
      }),
    ]);
    count++;
  }

  return NextResponse.json({ ok: true, expired: count });
}
