"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminVendorControls({
  vendorId,
  status,
  commissionRate,
}: {
  vendorId: string;
  status: string;
  commissionRate: number;
}) {
  const router = useRouter();
  const [commission, setCommission] = useState(String(commissionRate));
  const [busy, setBusy] = useState(false);

  async function patch(body: object) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json();
        alert(j.error ?? "Failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveCommission() {
    const v = Number(commission);
    if (!Number.isFinite(v)) return;
    await patch({ commissionRate: v });
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Actions</h2>
      <div className="flex flex-wrap gap-2">
        {status === "PENDING_APPROVAL" ? (
          <button
            type="button"
            disabled={busy}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            onClick={() => patch({ status: "ACTIVE" })}
          >
            Approve vendor
          </button>
        ) : null}
        {status === "ACTIVE" ? (
          <button
            type="button"
            disabled={busy}
            className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-800 disabled:opacity-50"
            onClick={() => {
              if (!confirm("Suspend this vendor? Their listings can be hidden from operations.")) return;
              patch({ status: "SUSPENDED" });
            }}
          >
            Suspend
          </button>
        ) : null}
        {status === "SUSPENDED" ? (
          <button
            type="button"
            disabled={busy}
            className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            onClick={() => patch({ status: "ACTIVE" })}
          >
            Reactivate
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs font-medium text-slate-700">
          Commission %
          <input
            type="number"
            step="0.1"
            className="mt-1 block w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={busy}
          className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          onClick={saveCommission}
        >
          Save commission
        </button>
      </div>
    </div>
  );
}
