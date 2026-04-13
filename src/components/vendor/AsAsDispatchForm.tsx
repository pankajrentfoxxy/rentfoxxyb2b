"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AsAsDispatchForm({ asasId, title }: { asasId: string; title: string }) {
  const router = useRouter();
  const [carrier, setCarrier] = useState("");
  const [awb, setAwb] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/vendor/asas/${asasId}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dispatchCarrier: carrier, dispatchAwb: awb }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Dispatch failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold text-slate-900">{title}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <input
          className="rounded border px-2 py-1.5 text-sm"
          placeholder="Carrier"
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
        />
        <input
          className="rounded border px-2 py-1.5 text-sm"
          placeholder="AWB / tracking no."
          value={awb}
          onChange={(e) => setAwb(e.target.value)}
        />
      </div>
      {err ? <p className="mt-1 text-xs text-red-600">{err}</p> : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void submit()}
        className="mt-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Saving…" : "Mark dispatched"}
      </button>
    </div>
  );
}
