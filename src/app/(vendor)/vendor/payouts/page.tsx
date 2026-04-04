import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const statusStyle: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  PROCESSING: "bg-sky-100 text-sky-900",
  RELEASED: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-rose-100 text-rose-800",
};

export default async function VendorPayoutsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!vendor) redirect("/auth/login");

  const rows = await prisma.payout.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      order: { select: { orderNumber: true, id: true } },
    },
  });

  const totals = rows.reduce(
    (acc, p) => {
      acc.gross += p.grossAmount;
      if (p.status === "RELEASED") acc.released += p.netAmount;
      else if (p.status === "PENDING" || p.status === "PROCESSING") acc.pending += p.netAmount;
      return acc;
    },
    { gross: 0, released: 0, pending: 0 },
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payouts</h1>
        <p className="mt-1 text-sm text-muted">
          Ledger of platform settlements for orders linked to your catalogue.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-muted">Pending / processing</p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            ₹{totals.pending.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-muted">Released</p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            ₹{totals.released.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-muted">Listed gross (all rows)</p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            ₹{totals.gross.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-surface">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-800">Date</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Order</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Gross</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Commission</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Net</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-800">UTR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  No payout rows yet. They appear after orders complete platform settlement flows.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="bg-white hover:bg-slate-50/80">
                  <td className="px-4 py-3 text-xs text-muted">
                    {new Date(p.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.order.orderNumber}</td>
                  <td className="px-4 py-3">₹{p.grossAmount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    ₹{p.commissionAmount.toLocaleString("en-IN")}{" "}
                    <span className="text-xs text-muted">({p.commissionRate}%)</span>
                  </td>
                  <td className="px-4 py-3 font-medium">₹{p.netAmount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyle[p.status] ?? "bg-surface text-slate-800"}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.utrNumber ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
