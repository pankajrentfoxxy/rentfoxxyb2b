"use client";

import { Ban, Percent } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const BRAND_COLOR = "bg-amber-600";
const BRAND_TEXT = "text-amber-600";

export function AdminVendorControls({
  vendorId,
  status,
  commissionRate,
  className = "",
}: {
  vendorId: string;
  status: string;
  commissionRate: number;
  className?: string;
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
    <section
      className={`flex h-full min-h-0 flex-col rounded-lg border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4 ${className}`.trim()}
    >
      <h3 className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Control center</h3>
      <div className="min-h-0 flex-1 space-y-3">
        <div className="flex flex-wrap gap-2">
          {status === "PENDING_APPROVAL" ? (
            <button
              type="button"
              disabled={busy}
              className="w-full rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-50 sm:w-auto"
              onClick={() => patch({ status: "ACTIVE" })}
            >
              Approve vendor
            </button>
          ) : null}
          {status === "SUSPENDED" ? (
            <button
              type="button"
              disabled={busy}
              className={`w-full rounded-md ${BRAND_COLOR} px-3 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-50 sm:w-auto`}
              onClick={() => patch({ status: "ACTIVE" })}
            >
              Reactivate
            </button>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
            <Percent size={14} className={BRAND_TEXT} strokeWidth={2} />
            Platform commission
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                step="0.1"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                disabled={busy}
                className={`w-full rounded-md border border-slate-200 py-1.5 pl-3 pr-8 text-xs font-semibold shadow-sm transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 disabled:opacity-50`}
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                %
              </span>
            </div>
            <button
              type="button"
              disabled={busy}
              className={`rounded-md ${BRAND_COLOR} px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-50`}
              onClick={saveCommission}
            >
              Update
            </button>
          </div>
        </div>

        {status === "ACTIVE" ? (
          <>
            <div className="h-px bg-slate-100" />
            <button
              type="button"
              disabled={busy}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-red-200/90 bg-red-50/60 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100/80 disabled:opacity-50"
              onClick={() => {
                if (!confirm("Suspend this vendor? Their listings can be hidden from operations.")) return;
                patch({ status: "SUSPENDED" });
              }}
            >
              <Ban size={15} strokeWidth={2} />
              Suspend vendor
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
