"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminPayoutRelease({
  pendingRows,
}: {
  pendingRows: {
    id: string;
    orderNumber: string;
    vendorName: string;
    grossAmount: number;
    commissionRate: number;
    netAmount: number;
    deliveredAt: string | null;
  }[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);

  const ids = pendingRows.filter((r) => selected[r.id]).map((r) => r.id);

  async function release() {
    if (!utr.trim() || ids.length === 0) {
      alert("Select payouts and enter UTR");
      return;
    }
    if (!confirm(`Release ${ids.length} payout(s) with UTR ${utr}?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/payouts/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutIds: ids, utrNumber: utr.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed");
        return;
      }
      setSelected({});
      setUtr("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-sm font-medium text-slate-700">
          UTR / reference
          <input
            className="mt-1 block rounded-lg border px-3 py-2 font-mono text-sm"
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
            placeholder="Bank UTR"
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={release}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Release selected
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-surface text-xs uppercase text-muted">
            <tr>
              <th className="px-3 py-2 w-10" />
              <th className="px-3 py-2">Order</th>
              <th className="px-3 py-2">Vendor</th>
              <th className="px-3 py-2">Gross</th>
              <th className="px-3 py-2">Comm %</th>
              <th className="px-3 py-2">Net</th>
              <th className="px-3 py-2">Delivered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pendingRows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={!!selected[r.id]}
                    onChange={(e) => setSelected((s) => ({ ...s, [r.id]: e.target.checked }))}
                  />
                </td>
                <td className="px-3 py-2 font-mono text-xs">{r.orderNumber}</td>
                <td className="px-3 py-2 text-xs">{r.vendorName}</td>
                <td className="px-3 py-2">₹{r.grossAmount.toLocaleString("en-IN")}</td>
                <td className="px-3 py-2">{r.commissionRate}%</td>
                <td className="px-3 py-2 font-medium">₹{r.netAmount.toLocaleString("en-IN")}</td>
                <td className="px-3 py-2 text-xs text-muted">{r.deliveredAt ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
