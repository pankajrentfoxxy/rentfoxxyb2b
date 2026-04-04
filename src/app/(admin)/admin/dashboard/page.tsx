import { AdminDashboardCharts } from "@/components/admin/AdminDashboardCharts";
import { adminDashboardKpis, adminGmvLast30Days, adminOrdersByStatus } from "@/lib/admin-kpis";
import { prisma } from "@/lib/prisma";
import { Activity, AlertTriangle, IndianRupee, Package, Store, UserRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default async function AdminDashboardPage() {
  const [kpis, gmvSeries, statusRows, pendingVendors, pendingPayouts, staleBids] = await Promise.all([
    adminDashboardKpis(),
    adminGmvLast30Days(),
    adminOrdersByStatus(),
    prisma.vendorProfile.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.payout.count({
      where: {
        status: { in: ["PENDING", "PROCESSING"] },
        order: { status: { in: ["DELIVERY_CONFIRMED", "DELIVERED", "PAYOUT_PENDING"] } },
      },
    }),
    prisma.bid.count({
      where: {
        status: "PENDING",
        createdAt: { lt: new Date(Date.now() - 48 * 3600 * 1000) },
      },
    }),
  ]);

  const [recentOrders, recentVendors, recentBids, recentPayouts] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, orderNumber: true, createdAt: true, totalAmount: true, status: true },
    }),
    prisma.vendorProfile.findMany({
      orderBy: { user: { createdAt: "desc" } },
      take: 5,
      include: { user: { select: { email: true, createdAt: true } } },
    }),
    prisma.bid.findMany({
      where: { status: { in: ["APPROVED", "PAID"] } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        listing: { include: { product: { select: { name: true } }, vendor: { select: { companyName: true } } } },
      },
    }),
    prisma.payout.findMany({
      where: { status: "RELEASED" },
      orderBy: { releasedAt: "desc" },
      take: 5,
      include: { vendor: { select: { companyName: true } }, order: { select: { orderNumber: true } } },
    }),
  ]);

  type Act = { at: Date; icon: string; text: string; href: string };
  const activity: Act[] = [];
  for (const o of recentOrders) {
    activity.push({
      at: o.createdAt,
      icon: "order",
      text: `Order ${o.orderNumber} — ${fmt(o.totalAmount)} (${o.status})`,
      href: `/admin/orders/${o.id}`,
    });
  }
  for (const v of recentVendors) {
    activity.push({
      at: v.user.createdAt,
      icon: "vendor",
      text: `Vendor signup: ${v.companyName} (${v.status})`,
      href: `/admin/vendors/${v.id}`,
    });
  }
  for (const b of recentBids) {
    activity.push({
      at: b.updatedAt,
      icon: "bid",
      text: `Bid ${b.status}: ${b.listing.product.name} — ${b.listing.vendor.companyName}`,
      href: `/admin/bids`,
    });
  }
  for (const p of recentPayouts) {
    if (!p.releasedAt) continue;
    activity.push({
      at: p.releasedAt,
      icon: "payout",
      text: `Payout released: ${fmt(p.netAmount)} → ${p.vendor.companyName} (${p.order.orderNumber})`,
      href: `/admin/payouts`,
    });
  }
  activity.sort((a, b) => b.at.getTime() - a.at.getTime());
  const topActivity = activity.slice(0, 12);

  const statusPie = statusRows
    .filter((r) => r.count > 0)
    .map((r) => ({
      name: r.status.replace(/_/g, " "),
      value: r.count,
    }));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
        <p className="mt-1 text-sm text-muted">Platform-wide KPIs and operational alerts.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Kpi title="Total GMV" value={fmt(kpis.totalGmv)} icon={<IndianRupee className="h-4 w-4" />} />
        <Kpi title="Orders today" value={String(kpis.ordersToday)} icon={<Package className="h-4 w-4" />} />
        <Kpi title="Active vendors" value={String(kpis.activeVendors)} icon={<Store className="h-4 w-4" />} />
        <Kpi title="Customers" value={String(kpis.activeCustomers)} icon={<UserRound className="h-4 w-4" />} />
        <Kpi title="Commission (est.)" value={fmt(kpis.commissionEarned)} icon={<IndianRupee className="h-4 w-4" />} />
        <Kpi title="Payouts pending" value={fmt(kpis.payoutsPending)} icon={<IndianRupee className="h-4 w-4" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 lg:col-span-1">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-950">
            <AlertTriangle className="h-4 w-4" /> Alerts
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-amber-950">
            <li>
              <Link href="/admin/vendors?tab=pending" className="font-medium underline">
                {pendingVendors} vendor{pendingVendors === 1 ? "" : "s"} pending approval
              </Link>
            </li>
            <li>
              <Link href="/admin/payouts?tab=pending" className="font-medium underline">
                {pendingPayouts} payout{pendingPayouts === 1 ? "" : "s"} ready to release
              </Link>
            </li>
            <li>
              <span>
                {staleBids} bid{staleBids === 1 ? "" : "s"} pending over 48h — nudge vendors via{" "}
                <Link href="/admin/bids" className="underline">
                  Bids
                </Link>
              </span>
            </li>
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Activity className="h-4 w-4 text-primary" /> Recent activity
          </h2>
          <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
            {topActivity.length === 0 ? (
              <li className="text-muted">No recent events.</li>
            ) : (
              topActivity.map((a, i) => (
                <li key={i} className="flex gap-2 border-b border-slate-100 py-2 last:border-0">
                  <span className="w-36 shrink-0 text-xs text-muted">{a.at.toLocaleString("en-IN")}</span>
                  <Link href={a.href} className="text-accent hover:underline">
                    {a.text}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <AdminDashboardCharts gmvSeries={gmvSeries} statusPie={statusPie.length ? statusPie : [{ name: "No data", value: 1 }]} />
    </div>
  );
}

function Kpi({ title, value, icon }: { title: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
