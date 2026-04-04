import { AdminOrdersFilter } from "@/components/admin/AdminOrdersFilter";
import { prisma } from "@/lib/prisma";
import type { OrderStatus, Prisma } from "@prisma/client";
import Link from "next/link";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: {
    vendorId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: string;
    maxAmount?: string;
    bidOnly?: string;
  };
}) {
  const vendorId = searchParams.vendorId ?? "";
  const status = searchParams.status as OrderStatus | undefined;
  const dateFrom = searchParams.dateFrom ?? "";
  const dateTo = searchParams.dateTo ?? "";
  const minAmount = searchParams.minAmount ?? "";
  const maxAmount = searchParams.maxAmount ?? "";
  const bidOnly = searchParams.bidOnly === "1";

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status;
  const created: Prisma.DateTimeFilter = {};
  if (dateFrom) created.gte = new Date(dateFrom);
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    created.lte = end;
  }
  if (Object.keys(created).length) where.createdAt = created;
  const amt: Prisma.FloatFilter = {};
  if (minAmount && Number.isFinite(Number(minAmount))) amt.gte = Number(minAmount);
  if (maxAmount && Number.isFinite(Number(maxAmount))) amt.lte = Number(maxAmount);
  if (Object.keys(amt).length) where.totalAmount = amt;
  if (bidOnly) where.bidId = { not: null };
  if (vendorId) where.items = { some: { listing: { vendorId } } };

  const [orders, vendors] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        customer: { include: { user: { select: { email: true, name: true } } } },
        items: { include: { listing: { include: { vendor: true, product: true } } } },
      },
    }),
    prisma.vendorProfile.findMany({ orderBy: { companyName: "asc" }, select: { id: true, companyName: true } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-muted">Cross-vendor visibility for ops and support.</p>
      </div>

      <AdminOrdersFilter
        vendors={vendors}
        initial={{ vendorId, status: status ?? "", dateFrom, dateTo, minAmount, maxAmount, bidOnly }}
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-surface text-xs font-semibold uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Order#</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Vendor(s)</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => {
              const vendorNames = Array.from(new Set(o.items.map((i) => i.listing.vendor.companyName)));
              const vLabel = vendorNames.length > 2 ? `${vendorNames.length} vendors` : vendorNames.join(", ");
              return (
                <tr key={o.id} className="bg-white hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-mono font-medium text-accent hover:underline">
                      {o.orderNumber}
                    </Link>
                    {o.bidId ? <span className="ml-1 text-[10px] font-bold text-amber-700">BID</span> : null}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {o.customer.user.name ?? o.customer.user.email}
                    <br />
                    <span className="text-muted">{o.customer.companyName}</span>
                  </td>
                  <td className="max-w-[200px] px-4 py-3 text-xs">{vLabel}</td>
                  <td className="px-4 py-3">{o.items.length}</td>
                  <td className="px-4 py-3">₹{o.totalAmount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-xs">{o.status.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-xs text-muted">{o.createdAt.toLocaleString("en-IN")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
