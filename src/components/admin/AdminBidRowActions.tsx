"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminBidRowActions({ bidId }: { bidId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function post(body: object) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/bids/${bidId}`, {
        method: "POST",
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

  return (
    <div className="flex flex-wrap gap-1">
      <button
        type="button"
        disabled={busy}
        className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
        onClick={() => post({ action: "force_approve", hours: 48 })}
      >
        Approve
      </button>
      <button
        type="button"
        disabled={busy}
        className="rounded border border-rose-300 px-2 py-1 text-[11px] font-semibold text-rose-800 disabled:opacity-50"
        onClick={() => {
          if (!confirm("Force reject this bid?")) return;
          post({ action: "force_reject" });
        }}
      >
        Reject
      </button>
      <button
        type="button"
        disabled={busy}
        className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold disabled:opacity-50"
        onClick={() => {
          const h = prompt("Extend by hours?", "24");
          if (!h) return;
          post({ action: "extend", hours: Number(h) });
        }}
      >
        +Hours
      </button>
    </div>
  );
}
