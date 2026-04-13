"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type HistoryEntry = {
  at: string;
  oldPrice: number;
  newPrice: number;
  note?: string;
  actor: string;
};

const MAX_REVISIONS = 5;

export function BidReviseSection({
  bidId,
  status,
  revisionCount,
  revisionHistory,
}: {
  bidId: string;
  status: string;
  revisionCount: number;
  revisionHistory: unknown;
}) {
  const router = useRouter();
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const history = Array.isArray(revisionHistory) ? (revisionHistory as HistoryEntry[]) : [];
  const canRevise =
    ["REJECTED", "COUNTER_OFFERED", "EXPIRED"].includes(status) && revisionCount < MAX_REVISIONS;

  async function submit() {
    const n = Number(price);
    if (!Number.isFinite(n) || n <= 0) {
      setErr("Enter a valid price per unit");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/customer/bids/${bidId}/revise`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newBidPrice: n, note: note.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Could not revise");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {history.length > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-sm font-semibold text-slate-900">Revision history</p>
          <ul className="mt-2 space-y-2 text-xs text-slate-700">
            {history.map((h, i) => (
              <li key={`${h.at}-${i}`} className="border-b border-slate-100 pb-2 last:border-0">
                <span className="text-muted">{new Date(h.at).toLocaleString("en-IN")}</span>
                {" · "}
                ₹{h.oldPrice.toLocaleString("en-IN")} → ₹{h.newPrice.toLocaleString("en-IN")}
                {h.note ? ` — ${h.note}` : ""}
                <span className="text-muted"> ({h.actor})</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">
            Revisions used: {revisionCount} / {MAX_REVISIONS}
          </p>
        </div>
      ) : null}

      {canRevise ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4">
          <p className="text-sm font-semibold text-amber-950">Revise your offer</p>
          <p className="mt-1 text-xs text-amber-900">
            Submit a new price per unit. Your request returns to the supplier for review.
          </p>
          <label className="mt-3 block text-xs font-medium text-slate-800">New price / unit (excl. GST)</label>
          <input
            className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 18500"
          />
          <label className="mt-2 block text-xs font-medium text-slate-800">Note (optional)</label>
          <input
            className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Short context for the supplier"
          />
          {err ? <p className="mt-2 text-xs text-red-700">{err}</p> : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="mt-3 rounded-lg bg-amber-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Submitting…" : "Submit revised bid"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
