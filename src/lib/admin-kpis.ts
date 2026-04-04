import { prisma } from "@/lib/prisma";

const START_OF_TODAY = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export async function adminDashboardKpis() {
  const today = START_OF_TODAY();

  const [
    gmvRows,
    ordersToday,
    activeVendors,
    activeCustomers,
    commissionSum,
    payoutsPendingAmount,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: {
        status: {
          notIn: ["PAYMENT_PENDING", "CANCELLED"],
        },
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.count({
      where: { createdAt: { gte: today } },
    }),
    prisma.vendorProfile.count({ where: { status: "ACTIVE" } }),
    prisma.customerProfile.count(),
    prisma.payout.aggregate({
      where: { status: "RELEASED" },
      _sum: { commissionAmount: true },
    }),
    prisma.payout.aggregate({
      where: { status: { in: ["PENDING", "PROCESSING"] } },
      _sum: { netAmount: true },
    }),
  ]);

  return {
    totalGmv: gmvRows._sum.totalAmount ?? 0,
    ordersToday,
    activeVendors,
    activeCustomers,
    commissionEarned: commissionSum._sum.commissionAmount ?? 0,
    payoutsPending: payoutsPendingAmount._sum.netAmount ?? 0,
  };
}

export async function adminGmvLast30Days() {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 29);
  start.setUTCHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: start },
      status: { notIn: ["PAYMENT_PENDING", "CANCELLED"] },
    },
    select: { createdAt: true, totalAmount: true },
  });

  const byDay = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + o.totalAmount);
  }
  return Array.from(byDay.entries()).map(([date, gmv]) => ({ date, gmv }));
}

export async function adminOrdersByStatus() {
  const grouped = await prisma.order.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  return grouped.map((g) => ({ status: g.status, count: g._count.id }));
}
