"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CounterOfferActions({ bidId }: { bidId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);

  async function act(action: "accept_counter" | "decline_counter") {
    setBusy(action === "accept_counter" ? "accept" : "decline");
    try {
      const res = await fetch(`/api/customer/bids/${bidId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => act("accept_counter")}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {busy === "accept" ? "…" : "Accept counter"}
      </button>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => act("decline_counter")}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
      >
        {busy === "decline" ? "…" : "Decline"}
      </button>
    </div>
  );
}
