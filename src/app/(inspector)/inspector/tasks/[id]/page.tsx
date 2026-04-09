import { getInspectorContext } from "@/lib/inspector-auth";
import { lotConditionToLabel } from "@/lib/lot-ai-cleaner";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InspectorTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getInspectorContext();
  if (!ctx) redirect("/inspector/login");

  const baseWhere = ctx.isManager ? { id } : { id, inspectorId: ctx.inspectorId! };
  const task = await prisma.verificationTask.findFirst({
    where: baseWhere,
    include: { vendor: true, inspector: { select: { name: true } } },
  });
  if (!task) notFound();

  const lotItems =
    task.listingType === "LOT"
      ? await prisma.lotInventoryItem.findMany({
          where: { lotId: task.listingId },
          orderBy: [{ brand: "asc" }, { model: "asc" }],
        })
      : [];
  const asasItems =
    task.listingType === "ASAS"
      ? await prisma.asAsInventoryItem.findMany({
          where: { asasId: task.listingId },
          orderBy: [{ brand: "asc" }, { model: "asc" }],
        })
      : [];

  const rows =
    task.listingType === "LOT" ? lotItems : task.listingType === "ASAS" ? asasItems : [];

  return (
    <div className="max-w-4xl space-y-4">
      <Link href="/inspector/dashboard" className="text-sm font-medium text-indigo-700 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Verification task</h1>
      <p className="text-sm text-muted">
        Type: <strong>{task.listingType}</strong> · Status: <strong>{task.status}</strong>
        {ctx.isManager && task.inspector?.name ? (
          <>
            {" "}
            · Inspector: <strong>{task.inspector.name}</strong>
          </>
        ) : null}
      </p>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-medium text-slate-800">Vendor</p>
        <p className="text-slate-900">{task.vendor.companyName}</p>
        <p className="mt-2 text-sm text-muted">GSTIN {task.vendor.gstin}</p>
        {task.vendorAddress ? (
          <p className="mt-4 text-sm">
            <strong>Warehouse</strong>
            <br />
            {task.vendorAddress}
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted">Warehouse address pending from vendor.</p>
        )}
      </div>

      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Brand</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Model</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Qty</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2">{r.brand}</td>
                  <td className="px-3 py-2">{r.model}</td>
                  <td className="px-3 py-2">{r.count}</td>
                  <td className="px-3 py-2">{lotConditionToLabel(r.condition)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {task.inspectorNotes ? (
        <div className="rounded-xl border border-slate-200 bg-amber-50/60 p-4 text-sm">
          <p className="font-semibold text-slate-800">Notes</p>
          <p className="mt-1 whitespace-pre-wrap text-slate-700">{task.inspectorNotes}</p>
        </div>
      ) : null}
    </div>
  );
}
