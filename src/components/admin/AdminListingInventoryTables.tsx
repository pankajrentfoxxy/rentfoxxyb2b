import { lotConditionToLabel } from "@/lib/lot-ai-cleaner";
import type { AsAsInventoryItem, LotInventoryItem } from "@prisma/client";

function cond(c: Parameters<typeof lotConditionToLabel>[0]) {
  return lotConditionToLabel(c);
}

const inr = (n: number) =>
  `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export function AdminLotItemsTable({ items }: { items: LotInventoryItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">No inventory rows.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-[72rem] w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2.5">Brand</th>
            <th className="px-3 py-2.5">Model</th>
            <th className="px-3 py-2.5">Generation</th>
            <th className="min-w-[10rem] px-3 py-2.5">Processor</th>
            <th className="px-3 py-2.5">RAM</th>
            <th className="px-3 py-2.5">Storage</th>
            <th className="px-3 py-2.5">SSD/HDD</th>
            <th className="px-3 py-2.5">Display</th>
            <th className="px-3 py-2.5">OS</th>
            <th className="px-3 py-2.5">Condition</th>
            <th className="px-3 py-2.5 text-right">Qty</th>
            <th className="px-3 py-2.5 text-right">Unit price</th>
            <th className="min-w-[8rem] px-3 py-2.5">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((i) => (
            <tr key={i.id} className="bg-white hover:bg-slate-50/80">
              <td className="sticky left-0 z-10 bg-white px-3 py-2 font-medium text-slate-900 shadow-[1px_0_0_0_rgb(226_232_240)]">
                {i.brand}
              </td>
              <td className="px-3 py-2 text-slate-800">{i.model}</td>
              <td className="px-3 py-2 text-muted">{i.generation ?? "—"}</td>
              <td className="px-3 py-2 text-slate-700">{i.processor}</td>
              <td className="px-3 py-2 whitespace-nowrap">{i.ramGb} GB</td>
              <td className="px-3 py-2 whitespace-nowrap">{i.storageGb} GB</td>
              <td className="px-3 py-2">{i.storageType}</td>
              <td className="px-3 py-2 whitespace-nowrap">{i.displayInch}&quot;</td>
              <td className="px-3 py-2 text-slate-700">{i.os}</td>
              <td className="px-3 py-2">{cond(i.condition)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{i.count}</td>
              <td className="px-3 py-2 text-right tabular-nums">{inr(i.unitPrice)}</td>
              <td className="max-w-[14rem] px-3 py-2 text-xs text-slate-600">{i.notes ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-slate-100 px-3 py-2 text-xs text-muted">
        {items.length} row{items.length === 1 ? "" : "s"} · cleaned CSV / wizard upload
      </p>
    </div>
  );
}

export function AdminAsAsItemsTable({ items }: { items: AsAsInventoryItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">No inventory rows.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-[56rem] w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2.5">Brand</th>
            <th className="px-3 py-2.5">Model</th>
            <th className="px-3 py-2.5">Generation</th>
            <th className="min-w-[10rem] px-3 py-2.5">Processor</th>
            <th className="px-3 py-2.5">RAM</th>
            <th className="px-3 py-2.5">Storage</th>
            <th className="px-3 py-2.5">Type</th>
            <th className="px-3 py-2.5">Condition</th>
            <th className="px-3 py-2.5 text-right">Qty</th>
            <th className="px-3 py-2.5 text-right">Est. value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((i) => (
            <tr key={i.id} className="bg-white hover:bg-slate-50/80">
              <td className="sticky left-0 z-10 bg-white px-3 py-2 font-medium text-slate-900 shadow-[1px_0_0_0_rgb(226_232_240)]">
                {i.brand}
              </td>
              <td className="px-3 py-2 text-slate-800">{i.model}</td>
              <td className="px-3 py-2 text-muted">{i.generation ?? "—"}</td>
              <td className="px-3 py-2 text-slate-700">{i.processor}</td>
              <td className="px-3 py-2 whitespace-nowrap">{i.ramGb} GB</td>
              <td className="px-3 py-2 whitespace-nowrap">{i.storageGb} GB</td>
              <td className="px-3 py-2">{i.storageType}</td>
              <td className="px-3 py-2">{cond(i.condition)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{i.count}</td>
              <td className="px-3 py-2 text-right tabular-nums">{inr(i.estimatedValue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-slate-100 px-3 py-2 text-xs text-muted">
        {items.length} row{items.length === 1 ? "" : "s"} · cleaned upload
      </p>
    </div>
  );
}
