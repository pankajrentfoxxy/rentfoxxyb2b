import { prisma } from "@/lib/prisma";
import type { BidStatus, OrderStatus } from "@prisma/client";

const ACTIONABLE_ORDER: OrderStatus[] = ["ORDER_PLACED", "ORDER_CONFIRMED"];
const REVENUE_ORDER: OrderStatus[] = [
  "DELIVERED",
  "DELIVERY_CONFIRMED",
  "PAYOUT_PENDING",
  "PAYOUT_RELEASED",
];

/** Orders that count toward vendor "new / to fulfil" tiles */
export async function vendorNewOrdersCount(vendorId: string) {
  return prisma.order.count({
    where: {
      status: { in: ACTIONABLE_ORDER },
      items: { some: { listing: { vendorId } } },
    },
  });
}

export async function vendorPendingBidsCount(vendorId: string) {
  const statuses: BidStatus[] = ["PENDING", "COUNTER_OFFERED"];
  return prisma.bid.count({
    where: {
      status: { in: statuses },
      listing: { vendorId },
    },
  });
}

/** Sum of this vendor's line subtotals on qualifying orders */
export async function vendorTotalRevenue(vendorId: string) {
  const rows = await prisma.orderItem.findMany({
    where: {
      listing: { vendorId },
      order: { status: { in: REVENUE_ORDER } },
    },
    select: { subtotal: true },
  });
  return rows.reduce((s, r) => s + r.subtotal, 0);
}

export async function vendorPayoutSums(vendorId: string) {
  const [pending, released] = await Promise.all([
    prisma.payout.aggregate({
      where: { vendorId, status: { in: ["PENDING", "PROCESSING"] } },
      _sum: { netAmount: true },
    }),
    prisma.payout.aggregate({
      where: { vendorId, status: "RELEASED" },
      _sum: { netAmount: true },
    }),
  ]);
  return {
    pending: pending._sum.netAmount ?? 0,
    released: released._sum.netAmount ?? 0,
  };
}

export type VendorDailyRevenuePoint = { date: string; amount: number };

/** Last `days` calendar days, UTC date key yyyy-mm-dd — vendor share of order total on that creation day */
export async function vendorDailyRevenueSeries(
  vendorId: string,
  days = 30,
): Promise<VendorDailyRevenuePoint[]> {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - (days - 1));
  start.setUTCHours(0, 0, 0, 0);

  const items = await prisma.orderItem.findMany({
    where: {
      listing: { vendorId },
      order: {
        createdAt: { gte: start },
        status: { in: REVENUE_ORDER },
      },
    },
    select: {
      subtotal: true,
      order: { select: { createdAt: true } },
    },
  });

  const byDay = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, 0);
  }

  for (const row of items) {
    const key = row.order.createdAt.toISOString().slice(0, 10);
    if (byDay.has(key)) {
      byDay.set(key, (byDay.get(key) ?? 0) + row.subtotal);
    }
  }

  return Array.from(byDay.entries()).map(([date, amount]) => ({ date, amount }));
}
