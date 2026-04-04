"use client";

import type { OrderStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ALL: OrderStatus[] = [
  "PAYMENT_PENDING",
  "TOKEN_PAID",
  "STOCK_RESERVED",
  "BALANCE_OVERDUE",
  "BALANCE_PAID",
  "ORDER_PLACED",
  "ORDER_CONFIRMED",
  "PACKED",
  "DISPATCHED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELIVERY_CONFIRMED",
  "PAYOUT_PENDING",
  "PAYOUT_RELEASED",
  "RETURN_REQUESTED",
  "REFUNDED",
  "CANCELLED",
  "TOKEN_FORFEITED",
];

export function AdminOrderOverride({
  orderId,
  currentStatus,
  adminNotes,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  adminNotes: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(adminNotes ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes: notes }),
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
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Admin override</h2>
      <label className="block text-xs font-medium text-slate-700">
        Status
        <select
          className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
        >
          {ALL.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-medium text-slate-700">
        Internal notes
        <textarea className="mt-1 w-full rounded-lg border px-2 py-2 text-sm" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={save}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        Save
      </button>
    </div>
  );
}
