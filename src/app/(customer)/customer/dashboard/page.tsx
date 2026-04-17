import { auth } from "@/lib/auth";
import { getStatusBadge, statusBadgeLabel } from "@/lib/status-badge";
import { prisma } from "@/lib/prisma";
import { Package, Gavel, Clock, IndianRupee, ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CustomerDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/auth/login");

  const now = new Date();

  const [
    totalOrders,
    activeBids,
    pendingPayments,
    spendAgg,
    recentOrders,
    bidRows,
  ] = await Promise.all([
    prisma.order.count({
      where: {
        customerId: profile.id,
        status: { notIn: ["PAYMENT_PENDING", "CANCELLED"] },
      },
    }),
    prisma.bid.count({
      where: {
        customerId: profile.id,
        status: { in: ["PENDING", "APPROVED", "COUNTER_OFFERED"] },
      },
    }),
    prisma.order.count({
      where: { customerId: profile.id, status: "PAYMENT_PENDING" },
    }),
    prisma.order.aggregate({
      where: {
        customerId: profile.id,
        status: { notIn: ["PAYMENT_PENDING", "CANCELLED", "REFUNDED"] },
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      where: { customerId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true, payments: true },
    }),
    prisma.bid.findMany({
      where: {
        customerId: profile.id,
        status: { in: ["PENDING", "APPROVED", "COUNTER_OFFERED"] },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        listing: { include: { product: { select: { name: true, images: true, slug: true } } } },
      },
    }),
  ]);

  const totalSpend = spendAgg._sum.totalAmount ?? 0;

  const kpi = [
    {
      label: "Total orders",
      value: totalOrders,
      icon: Package,
      iconWrap: "bg-lot-bg text-lot",
    },
    {
      label: "Active bids",
      value: activeBids,
      icon: Gavel,
      iconWrap: "bg-amber-bg text-amber-dark",
    },
    {
      label: "Pending payments",
      value: pendingPayments,
      icon: Clock,
      iconWrap: "bg-orange-50 text-orange-700",
    },
    {
      label: "Total spend",
      value: `₹${totalSpend.toLocaleString("en-IN")}`,
      icon: IndianRupee,
      iconWrap: "bg-verified-bg text-verified-text",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <h1 className="text-[22px] font-medium text-ink-primary">Dashboard</h1>
        <p className="mt-1 text-[12px] text-ink-muted">Overview of your procurement activity.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpi.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-white p-4">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.iconWrap}`}>
              <c.icon className="h-4 w-4" />
            </div>
            <p className="mt-2 text-[22px] font-medium text-ink-primary">{c.value}</p>
            <p className="text-[12px] text-ink-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent orders</h2>
            <Link href="/customer/orders" className="text-sm font-medium text-lot hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {recentOrders.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted">No orders yet.</li>
            ) : (
              recentOrders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <Link href={`/customer/orders/${o.id}`} className="font-mono font-medium text-lot hover:underline">
                      {o.orderNumber}
                    </Link>
                    <p className="text-muted">
                      {o.createdAt.toLocaleDateString("en-IN")} · {o.items.length} line(s) · ₹
                      {o.totalAmount.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded px-2 py-0.5 text-[10px] font-medium capitalize ${getStatusBadge(o.status)}`}
                  >
                    {statusBadgeLabel(o.status)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Active bids</h2>
            <Link href="/customer/bids" className="text-sm font-medium text-lot hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {bidRows.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted">No open bids.</li>
            ) : (
              bidRows.map((b) => (
                <li key={b.id} className="py-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/customer/bids/${b.id}`} className="font-medium text-lot hover:underline">
                        {b.listing.product.name}
                      </Link>
                      <p className="text-muted">
                        ₹{b.bidPricePerUnit.toLocaleString("en-IN")}/unit · Qty {b.quantity}
                      </p>
                    </div>
                    {b.status === "APPROVED" ? (
                      <Link
                        href={`/customer/bids/${b.id}`}
                        className="shrink-0 rounded-lg bg-amber px-3 py-1.5 text-xs font-semibold text-navy hover:bg-amber-dark"
                      >
                        Pay now
                      </Link>
                    ) : b.status === "PENDING" ? (
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-lot border-t-transparent" />
                        Under review
                      </span>
                    ) : (
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-[10px] font-medium capitalize ${getStatusBadge(b.status)}`}
                      >
                        {statusBadgeLabel(b.status)}
                      </span>
                    )}
                  </div>
                  {b.status === "APPROVED" && b.expiresAt && b.expiresAt > now ? (
                    <p className="mt-1 text-xs text-orange-700">
                      Offer valid until {b.expiresAt.toLocaleString("en-IN")}
                    </p>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="flex flex-wrap gap-3 rounded-xl border border-dashed border-slate-200 bg-surface p-6">
        <p className="w-full text-sm font-medium text-slate-800">Quick actions</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
        >
          <ShoppingBag className="h-4 w-4" />
          Browse products
        </Link>
        <Link
          href="/customer/bids"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
        >
          <Gavel className="h-4 w-4" />
          New bid request
        </Link>
        <Link
          href="/customer/invoices"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
        >
          <ArrowRight className="h-4 w-4" />
          Download invoices
        </Link>
      </section>
    </div>
  );
}
