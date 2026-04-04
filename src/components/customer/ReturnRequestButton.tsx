"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReturnRequestButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function req() {
    if (!confirm("Request a return for this order?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/customer/orders/${orderId}/return`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed");
        return;
      }
      router.refresh();
      alert("Return requested. Our team will contact you.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={req}
      className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-900 hover:bg-orange-100 disabled:opacity-50"
    >
      {busy ? "…" : "Request return"}
    </button>
  );
}
