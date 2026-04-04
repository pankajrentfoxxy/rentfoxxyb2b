"use client";

import { useState } from "react";

export function VendorListingToggle({
  listingId,
  initialActive,
  productActive,
}: {
  listingId: string;
  initialActive: boolean;
  productActive: boolean;
}) {
  const [on, setOn] = useState(initialActive && productActive);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const next = !on;
      if (next && !productActive) {
        alert("This catalog product is inactive on the platform. Activate the product before turning the listing on.");
        return;
      }
      const res = await fetch(`/api/vendor/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      if (!res.ok) {
        const j = await res.json();
        alert(j.error ?? "Failed");
        return;
      }
      setOn(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={toggle}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
        on
          ? "bg-emerald-100 text-emerald-800"
          : "bg-slate-200 text-slate-700"
      } disabled:opacity-50`}
    >
      {busy ? "…" : on ? "Active" : "Inactive"}
    </button>
  );
}
