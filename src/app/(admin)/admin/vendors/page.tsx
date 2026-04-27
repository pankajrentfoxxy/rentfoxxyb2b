import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import Link from "next/link";

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: { tab?: string; lowScore?: string };
}) {
  const pendingOnly = searchParams.tab === "pending";
  const lowScore = searchParams.lowScore === "1";

  const and: Prisma.VendorProfileWhereInput[] = [];
  if (pendingOnly) and.push({ status: "PENDING_APPROVAL" });
  if (lowScore) {
    and.push({
      OR: [
        { vendorScore: { is: null } },
        { vendorScore: { overallScore: { lt: 60 } } },
      ],
    });
  }
  const where: Prisma.VendorProfileWhereInput = and.length ? { AND: and } : {};

  const vendors = await prisma.vendorProfile.findMany({
    where,
    orderBy: { companyName: "asc" },
    include: {
      user: { select: { email: true } },
      listings: { select: { id: true } },
      vendorScore: { select: { overallScore: true } },
    },
  });

  const stats = await Promise.all(
    vendors.map(async (v) => {
      const revenue = await prisma.orderItem.aggregate({
        where: { listing: { vendorId: v.id } },
        _sum: { subtotal: true },
      });
      const orderCount = await prisma.order.count({
        where: { items: { some: { listing: { vendorId: v.id } } } },
      });
      return { vendorId: v.id, revenue: revenue._sum.subtotal ?? 0, orderCount };
    }),
  );
  const map = new Map(stats.map((s) => [s.vendorId, s]));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendors</h1>
          <p className="mt-1 text-sm text-muted">Full vendor identity visible here only.</p>
        </div>
        <Link
          href="/admin/vendors/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Add vendor
        </Link>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <Link
          href="/admin/vendors"
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${!pendingOnly ? "bg-primary text-white" : "bg-slate-100"}`}
        >
          All
        </Link>
        <Link
          href="/admin/vendors?tab=pending"
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${pendingOnly ? "bg-amber-600 text-white" : "bg-slate-100"}`}
        >
          Pending approval
        </Link>
        <Link
          href="/admin/vendors?lowScore=1"
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${lowScore && !pendingOnly ? "bg-red-600 text-white" : "bg-slate-100"}`}
        >
          Score below 60
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-surface text-xs font-semibold uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">GSTIN</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Revenue</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vendors.map((v) => {
              const s = map.get(v.id)!;
              return (
                <tr key={v.id} className="bg-white hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium text-slate-900">{v.companyName}</td>
                  <td className="px-4 py-3 font-mono text-xs">{v.gstin}</td>
                  <td className="px-4 py-3 text-xs">{v.user.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium">{v.status}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {v.vendorScore?.overallScore != null && v.vendorScore.overallScore > 0
                      ? v.vendorScore.overallScore
                      : "—"}
                  </td>
                  <td className="px-4 py-3">{v.commissionRate}%</td>
                  <td className="px-4 py-3">{s.orderCount}</td>
                  <td className="px-4 py-3">₹{s.revenue.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/vendors/${v.id}`} className="text-accent hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
