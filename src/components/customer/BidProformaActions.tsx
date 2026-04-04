"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BidProformaActions({
  bidId,
  invoiceId,
  invoiceNumber,
}: {
  bidId: string;
  invoiceId: string | null;
  invoiceNumber?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function ensureProforma() {
    setBusy(true);
    try {
      const res = await fetch(`/api/customer/bids/${bidId}/proforma`, { method: "POST" });
      if (!res.ok) return;
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (invoiceId) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-surface px-4 py-3 text-sm">
        <span className="text-muted">Proforma: {invoiceNumber ?? invoiceId}</span>
        <a
          href={`/api/customer/invoices/${invoiceId}/download`}
          className="font-medium text-accent hover:underline"
        >
          Download PDF
        </a>
        <button
          type="button"
          disabled={busy}
          onClick={() => void ensureProforma()}
          className="text-xs font-medium text-muted hover:text-accent disabled:opacity-50"
        >
          {busy ? "Refreshing…" : "Regenerate"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm">
      <p className="text-muted">Proforma PDF not generated yet.</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void ensureProforma()}
        className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Working…" : "Create proforma invoice"}
      </button>
    </div>
  );
}
