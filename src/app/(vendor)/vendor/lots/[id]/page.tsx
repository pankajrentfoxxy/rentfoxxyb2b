"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Lot = {
  id: string;
  title: string;
  status: string;
  lotsSold: number;
  totalLots: number;
  totalQuantity: number;
  lotSize: number;
  pricePerLot: number;
};

export default function VendorLotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lot, setLot] = useState<Lot | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [carrier, setCarrier] = useState("");
  const [awb, setAwb] = useState("");

  useEffect(() => {
    void (async () => {
      const r = await fetch("/api/vendor/lots");
      const d = await r.json();
      const found = (d.lots as Lot[] | undefined)?.find((x) => x.id === id);
      setLot(found ?? null);
    })();
  }, [id]);

  async function dispatch() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/vendor/lots/${id}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dispatchCarrier: carrier.trim(), dispatchAwb: awb.trim() }),
      });
      const data = await r.json();
      if (!r.ok) setErr(data.error ?? "Dispatch failed");
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!lot) return <p className="text-sm text-muted">Loading…</p>;

  const canDispatch = lot.status === "SOLD_OUT";

  return (
    <div className="space-y-6">
      <Link href="/vendor/lots" className="text-sm font-medium text-accent hover:underline">
        ← Lots
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{lot.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {lot.status} · {lot.lotsSold}/{lot.totalLots} lots sold
        </p>
      </div>
      {err ? <p className="text-sm text-red-700">{err}</p> : null}
      {canDispatch ? (
        <div className="max-w-md space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-800">Shipment details</p>
          <label className="block text-xs font-medium text-slate-600">Carrier</label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="e.g. Blue Dart"
          />
          <label className="block text-xs font-medium text-slate-600">AWB / tracking number</label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={awb}
            onChange={(e) => setAwb(e.target.value)}
            placeholder="Tracking ID"
          />
          <button
            type="button"
            disabled={busy || !carrier.trim() || !awb.trim()}
            onClick={() => void dispatch()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Dispatching…" : "Dispatch & generate manifests"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted">Dispatch unlocks when all lots are sold.</p>
      )}
    </div>
  );
}
