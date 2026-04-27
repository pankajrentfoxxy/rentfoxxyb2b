import { VendorRevenueChart } from "@/components/vendor/VendorRevenueChart";
import {
  vendorDailyRevenueSeries,
  vendorNewOrdersCount,
  vendorPendingBidsCount,
  vendorPayoutSums,
  vendorTotalRevenue,
} from "@/lib/vendor-dashboard-data";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getScoreLabel } from "@/lib/vendor-score";
import Link from "next/link";
import { redirect } from "next/navigation";

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export default async function VendorDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
    include: { vendorScore: true },
  });
  if (!vendor) redirect("/auth/login");

  const [
    newOrders,
    pendingBids,
    totalRev,
    payouts,
    series,
    recentBids,
    recentOrders,
  ] = await Promise.all([
    vendorNewOrdersCount(vendor.id),
    vendorPendingBidsCount(vendor.id),
    vendorTotalRevenue(vendor.id),
    vendorPayoutSums(vendor.id),
    vendorDailyRevenueSeries(vendor.id, 30),
    prisma.bid.findMany({
      where: { listing: { vendorId: vendor.id }, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        listing: { include: { product: { select: { name: true, slug: true } } } },
      },
    }),
    prisma.order.findMany({
      where: { items: { some: { listing: { vendorId: vendor.id } } } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        items: { include: { listing: { include: { product: { select: { name: true } } } } } },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Overview of orders, bids, and payouts for {vendor.companyName}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Performance score"
          value={
            vendor.vendorScore && vendor.vendorScore.overallScore > 0
              ? String(vendor.vendorScore.overallScore)
              : "—"
          }
          hint={
            vendor.vendorScore && vendor.vendorScore.overallScore > 0
              ? getScoreLabel(vendor.vendorScore.overallScore)
              : "Computed daily from delivery, fulfilment & reviews"
          }
        />
        <KpiCard
          label="New orders to fulfil"
          value={String(newOrders)}
          hint="Placed / confirmed, your SKUs"
        />
        <KpiCard label="Pending bids" value={String(pendingBids)} hint="Awaiting your action" />
        <KpiCard
          label="Total revenue (your lines)"
          value={`₹${totalRev.toLocaleString("en-IN")}`}
          hint="Delivered & payout-stage orders"
        />
        <KpiCard
          label="Pending payout"
          value={`₹${payouts.pending.toLocaleString("en-IN")}`}
          hint="Processing + pending"
        />
        <KpiCard
          label="Released payout"
          value={`₹${payouts.released.toLocaleString("en-IN")}`}
          hint="Paid to your bank"
        />
      </div>

      <VendorRevenueChart data={series} />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">Recent bid requests</h2>
            <Link href="/vendor/bids" className="text-xs font-medium text-accent hover:underline">
              View all
            </Link>
          </div>
          {recentBids.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No open bids.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {recentBids.map((b) => {
                const margin =
                  b.listing.unitPrice > 0
                    ? Math.round(
                        ((b.bidPricePerUnit - b.listing.unitPrice) / b.listing.unitPrice) * 1000,
                      ) / 10
                    : 0;
                return (
                  <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{b.listing.product.name}</p>
                      <p className="text-xs text-muted">
                        ₹{b.bidPricePerUnit.toLocaleString("en-IN")}/unit · margin {margin > 0 ? "+" : ""}
                        {margin}%
                      </p>
                    </div>
                    <Link
                      href="/vendor/bids"
                      className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
                    >
                      Act
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">Recent orders</h2>
            <Link href="/vendor/orders" className="text-xs font-medium text-accent hover:underline">
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No orders with your items yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {recentOrders.map((o) => {
                const share = o.items
                  .filter((i) => i.listing.vendorId === vendor.id)
                  .reduce((s, i) => s + i.subtotal, 0);
                const names = o.items
                  .filter((i) => i.listing.vendorId === vendor.id)
                  .map((i) => i.listing.product.name)
                  .slice(0, 2)
                  .join(", ");
                return (
                  <li key={o.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <Link
                          href={`/vendor/orders/${o.id}`}
                          className="text-sm font-semibold text-accent hover:underline"
                        >
                          {o.orderNumber}
                        </Link>
                        <p className="text-xs text-muted">{names}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-900">
                          ₹{share.toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-muted">{o.status.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}
