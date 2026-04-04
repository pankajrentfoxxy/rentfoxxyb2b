import { getVendorContext } from "@/lib/vendor-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const COMPLETED = [
  "ORDER_PLACED",
  "ORDER_CONFIRMED",
  "PACKED",
  "DISPATCHED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELIVERY_CONFIRMED",
  "PAYOUT_PENDING",
  "PAYOUT_RELEASED",
] as const;

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const vctx = await getVendorContext();
  if (!vctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: bidId } = await ctx.params;

  const bid = await prisma.bid.findFirst({
    where: { id: bidId, listing: { vendorId: vctx.vendorId } },
    include: { customer: true },
  });

  if (!bid) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const profile = bid.customer;

  const orders = await prisma.order.findMany({
    where: {
      customerId: profile.id,
      status: { in: [...COMPLETED] },
    },
    select: {
      tokenAmount: true,
      balancePaidAt: true,
      balanceDueAt: true,
      status: true,
    },
  });

  let onTime = 0;
  let counted = 0;
  for (const o of orders) {
    const token = o.tokenAmount != null && o.tokenAmount > 0;
    if (token) {
      if (o.balancePaidAt && o.balanceDueAt) {
        counted++;
        if (o.balancePaidAt <= o.balanceDueAt) onTime++;
      }
    } else if (COMPLETED.includes(o.status as (typeof COMPLETED)[number])) {
      counted++;
      onTime++;
    }
  }
  const onTimePaymentRate = counted ? Math.round((onTime / counted) * 100) : 100;

  const orderCount = orders.length;
  const avgRating = profile.avgRating;
  let tier: "gold" | "silver" | "new" = "new";
  if (orderCount >= 3 && avgRating >= 4) tier = "gold";
  else if (avgRating >= 3) tier = "silver";

  return NextResponse.json({
    tier,
    avgRating: Math.round(avgRating * 10) / 10,
    reviewCount: profile.reviewCount,
    orderCount,
    onTimePaymentRate,
  });
}
