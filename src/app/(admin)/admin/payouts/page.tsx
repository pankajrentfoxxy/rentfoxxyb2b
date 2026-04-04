import { AdminPayoutRelease } from "@/components/admin/AdminPayoutRelease";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const tab = searchParams.tab ?? "pending";

  const eligibleOrderStatuses = ["DELIVERY_CONFIRMED", "DELIVERED", "PAYOUT_PENDING"] as const;

  const [pending, processing, released, vendors] = await Promise.all([
    prisma.payout.findMany({
      where: {
        status: "PENDING",
        order: { status: { in: [...eligibleOrderStatuses] } },
      },
      orderBy: { createdAt: "desc" },
      include: { vendor: true, order: { include: { shipment: true } } },
    }),
    prisma.payout.findMany({
      where: { status: "PROCESSING" },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { vendor: true, order: true },
    }),
    prisma.payout.findMany({
      where: { status: "RELEASED" },
      orderBy: { releasedAt: "desc" },
      take: 100,
      include: { vendor: true, order: true },
    }),
    prisma.vendorProfile.findMany({
      orderBy: { companyName: "asc" },
      select: { id: true, companyName: true, commissionRate: true },
    }),
  ]);

  const pendingRows = pending.map((p) => ({
    id: p.id,
    orderNumber: p.order.orderNumber,
    vendorName: p.vendor.companyName,
    grossAmount: p.grossAmount,
    commissionRate: p.commissionRate,
    netAmount: p.netAmount,
    deliveredAt: p.order.shipment?.deliveredAt?.toISOString() ?? null,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payouts</h1>
        <p className="mt-1 text-sm text-muted">Release settlements after delivery confirmation.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {(
          [
            ["pending", "Pending release"],
            ["processing", "Processing"],
            ["released", "Released"],
            ["commission", "Commission"],
          ] as const
        ).map(([id, label]) => (
          <Link
            key={id}
            href={`/admin/payouts?tab=${id}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              tab === id ? "bg-primary text-white" : "bg-slate-100 text-slate-800"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {tab === "pending" ? (
        pending.length === 0 ? (
          <p className="text-sm text-muted">No pending payouts eligible for release.</p>
        ) : (
          <AdminPayoutRelease pendingRows={pendingRows} />
        )
      ) : null}

      {tab === "processing" ? (
        <PayoutTable
          rows={processing.map((p) => ({
            id: p.id,
            orderNumber: p.order.orderNumber,
            vendorName: p.vendor.companyName,
            grossAmount: p.grossAmount,
            netAmount: p.netAmount,
            status: p.status,
            utrNumber: p.utrNumber,
          }))}
        />
      ) : null}
      {tab === "released" ? (
        <PayoutTable
          rows={released.map((p) => ({
            id: p.id,
            orderNumber: p.order.orderNumber,
            vendorName: p.vendor.companyName,
            grossAmount: p.grossAmount,
            netAmount: p.netAmount,
            status: p.status,
            utrNumber: p.utrNumber,
          }))}
        />
      ) : null}

      {tab === "commission" ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <p className="border-b border-slate-200 bg-surface px-4 py-2 text-sm text-muted">
            Default platform rate is in Settings. Per-vendor overrides below.
          </p>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-surface text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Commission %</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendors.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-3">{v.companyName}</td>
                  <td className="px-4 py-3">{v.commissionRate}%</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/vendors/${v.id}`} className="text-accent hover:underline">
                      Edit vendor
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function PayoutTable({
  rows,
}: {
  rows: {
    id: string;
    orderNumber: string;
    vendorName: string;
    grossAmount: number;
    netAmount: number;
    status: string;
    utrNumber: string | null;
  }[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-surface text-xs uppercase text-muted">
          <tr>
            <th className="px-3 py-2">Order</th>
            <th className="px-3 py-2">Vendor</th>
            <th className="px-3 py-2">Gross</th>
            <th className="px-3 py-2">Net</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">UTR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((p) => (
            <tr key={p.id}>
              <td className="px-3 py-2 font-mono text-xs">{p.orderNumber}</td>
              <td className="px-3 py-2 text-xs">{p.vendorName}</td>
              <td className="px-3 py-2">₹{p.grossAmount.toLocaleString("en-IN")}</td>
              <td className="px-3 py-2">₹{p.netAmount.toLocaleString("en-IN")}</td>
              <td className="px-3 py-2">{p.status}</td>
              <td className="px-3 py-2 font-mono text-xs">{p.utrNumber ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
