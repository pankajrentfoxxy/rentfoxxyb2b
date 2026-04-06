"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AsAsBuyClient({
  asasId,
  maxQty,
  avgUnitPrice,
}: {
  asasId: string;
  maxQty: number;
  avgUnitPrice: number;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function buy() {
    if (status !== "authenticated") {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/asas/listings/${asasId}`)}`);
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/customer/asas-purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asasId, quantity: qty }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Could not purchase");
        return;
      }
      setMsg("Purchase recorded (demo flow).");
    } finally {
      setBusy(false);
    }
  }

  if (maxQty <= 0) {
    return <p className="mt-6 text-sm text-muted">Sold out.</p>;
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
      <label className="block text-sm font-medium text-slate-800">Units</label>
      <input
        type="number"
        min={1}
        max={maxQty}
        className="mt-2 w-32 rounded border px-3 py-2 text-sm"
        value={qty}
        onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))}
      />
      <p className="mt-2 text-sm">Approx total ₹{(qty * avgUnitPrice).toLocaleString("en-IN")}</p>
      {msg ? <p className="mt-3 text-sm text-emerald-800">{msg}</p> : null}
      {status === "unauthenticated" ? (
        <p className="mt-3 text-sm">
          <Link href={`/auth/login?callbackUrl=${encodeURIComponent(`/asas/listings/${asasId}`)}`} className="font-medium text-accent hover:underline">
            Log in
          </Link>{" "}
          to buy.
        </p>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void buy()}
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Working…" : "Buy now (demo)"}
      </button>
    </div>
  );
}
