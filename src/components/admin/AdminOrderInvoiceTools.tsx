"use client";

import type { OrderStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminOrderInvoiceTools({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"tax" | "credit" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function generateTax() {
    setErr(null);
    setBusy("tax");
    try {
      const res = await fetch(`/api/admin/invoices/generate/${orderId}`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "Failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function issueCredit() {
    setErr(null);
    setBusy("credit");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/credit-note`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "Failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const canCredit = status === "REFUNDED" || status === "CANCELLED";

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Invoices (GST)</h2>
      <p className="text-xs text-muted">Tax invoices are also created automatically after payment when possible.</p>
      {err ? <p className="text-xs text-rose-600">{err}</p> : null}
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => void generateTax()}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-surface disabled:opacity-50"
      >
        {busy === "tax" ? "Generating…" : "Generate / refresh tax invoice PDF"}
      </button>
      <button
        type="button"
        disabled={busy !== null || !canCredit}
        onClick={() => void issueCredit()}
        className="w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-50"
      >
        {busy === "credit" ? "Working…" : "Issue credit note (refunded / cancelled)"}
      </button>
    </div>
  );
}
