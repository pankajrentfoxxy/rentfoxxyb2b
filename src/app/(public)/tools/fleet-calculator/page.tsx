"use client";

import Link from "next/link";
import { useState } from "react";

export default function FleetCalculatorPage() {
  const [fleetSize, setFleetSize] = useState(100);
  const [avgAge, setAvgAge] = useState(3);
  const [targetLife, setTargetLife] = useState(4);
  const [avgNewPrice, setAvgNewPrice] = useState(45000);
  const [avgRefurbPrice, setAvgRefurbPrice] = useState(28000);
  const [busy, setBusy] = useState(false);

  const renewTotal = fleetSize * avgNewPrice;
  const refurbTotal = fleetSize * avgRefurbPrice;
  const savings = Math.max(0, renewTotal - refurbTotal);

  async function downloadPdf() {
    setBusy(true);
    try {
      const res = await fetch("/api/tools/fleet-calculator/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fleetSize,
          avgAge,
          targetLife,
          avgNewPrice,
          avgRefurbPrice,
        }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fleet-renewal-report.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <nav className="text-[12px] text-ink-muted">
        <Link href="/" className="hover:text-navy">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-primary">Fleet calculator</span>
      </nav>
      <h1 className="mt-4 text-2xl font-semibold text-ink-primary">Fleet renewal calculator</h1>
      <p className="mt-2 text-sm text-ink-muted">
        How much does your fleet renewal cost? Model a full refresh vs verified refurb pricing.
      </p>

      <div className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6">
        <label className="block text-[13px] font-medium text-ink-primary">
          Fleet size (units)
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            value={fleetSize}
            onChange={(e) => setFleetSize(Number(e.target.value))}
          />
        </label>
        <label className="block text-[13px] font-medium text-ink-primary">
          Average age of current fleet (years)
          <input
            type="number"
            min={0}
            step={0.5}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            value={avgAge}
            onChange={(e) => setAvgAge(Number(e.target.value))}
          />
        </label>
        <label className="block text-[13px] font-medium text-ink-primary">
          Target useful life (years)
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            value={targetLife}
            onChange={(e) => setTargetLife(Number(e.target.value))}
          />
        </label>
        <label className="block text-[13px] font-medium text-ink-primary">
          Assumed new laptop price (₹ / unit, ex-GST)
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            value={avgNewPrice}
            onChange={(e) => setAvgNewPrice(Number(e.target.value))}
          />
        </label>
        <label className="block text-[13px] font-medium text-ink-primary">
          Assumed verified refurb price (₹ / unit, ex-GST)
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            value={avgRefurbPrice}
            onChange={(e) => setAvgRefurbPrice(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="mt-6 rounded-xl border border-amber-border bg-amber-bg p-6 text-amber-dark">
        <p className="text-[13px] font-medium">Full refresh (new)</p>
        <p className="mt-1 text-2xl font-bold">₹{renewTotal.toLocaleString("en-IN")}</p>
        <p className="mt-4 text-[13px] font-medium">Verified refurb total</p>
        <p className="mt-1 text-xl font-semibold">₹{refurbTotal.toLocaleString("en-IN")}</p>
        <p className="mt-4 text-sm">
          Estimated savings vs buying new: <strong>₹{savings.toLocaleString("en-IN")}</strong>
        </p>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => void downloadPdf()}
        className="mt-6 w-full rounded-lg bg-navy py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Generating…" : "Download full report (PDF)"}
      </button>
    </div>
  );
}
