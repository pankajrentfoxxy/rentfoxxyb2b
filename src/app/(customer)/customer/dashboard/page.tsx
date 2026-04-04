import { auth } from "@/lib/auth";
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
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Active bids",
      value: activeBids,
      icon: Gavel,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Pending payments",
      value: pendingPayments,
      icon: Clock,
      color: "text-orange-600 bg-orange-50",
    },
    {
      label: "Total spend",
      value: `₹${totalSpend.toLocaleString("en-IN")}`,
      icon: IndianRupee,
      color: "text-emerald-600 bg-emerald-50",
    },
  ];

  function statusBadge(status: string) {
    const s = status.toLowerCase().replace(/_/g, " ");
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700">
        {s}
      </span>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Overview of your procurement activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpi.map((c) => (
          <div
            key={c.label}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className={`rounded-lg p-3 ${c.color}`}>
              <c.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted">{c.label}</p>
              <p className="text-xl font-bold text-slate-900">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent orders</h2>
            <Link href="/customer/orders" className="text-sm font-medium text-accent hover:underline">
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
                    <Link href={`/customer/orders/${o.id}`} className="font-mono font-medium text-accent hover:underline">
                      {o.orderNumber}
                    </Link>
                    <p className="text-muted">
                      {o.createdAt.toLocaleDateString("en-IN")} · {o.items.length} line(s) · ₹
                      {o.totalAmount.toLocaleString("en-IN")}
                    </p>
                  </div>
                  {statusBadge(o.status)}
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Active bids</h2>
            <Link href="/customer/bids" className="text-sm font-medium text-accent hover:underline">
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
                      <Link href={`/customer/bids/${b.id}`} className="font-medium text-accent hover:underline">
                        {b.listing.product.name}
                      </Link>
                      <p className="text-muted">
                        ₹{b.bidPricePerUnit.toLocaleString("en-IN")}/unit · Qty {b.quantity}
                      </p>
                    </div>
                    {b.status === "APPROVED" ? (
                      <Link
                        href={`/customer/bids/${b.id}`}
                        className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                      >
                        Pay now
                      </Link>
                    ) : b.status === "PENDING" ? (
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                        Under review
                      </span>
                    ) : (
                      statusBadge(b.status)
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
