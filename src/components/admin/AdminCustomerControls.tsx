"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminCustomerControls({
  customerProfileId,
  isVerified,
  gstVerified,
}: {
  customerProfileId: string;
  isVerified: boolean;
  gstVerified: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function patch(body: object) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerProfileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json();
        alert(j.error ?? "Failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Account</h2>
      <button
        type="button"
        disabled={busy}
        className="w-full rounded-lg border px-3 py-2 text-sm font-medium"
        onClick={() => patch({ isVerified: !isVerified })}
      >
        User verified: {isVerified ? "Yes — click to revoke" : "No — click to verify"}
      </button>
      <button
        type="button"
        disabled={busy}
        className="w-full rounded-lg border px-3 py-2 text-sm font-medium"
        onClick={() => patch({ gstVerified: !gstVerified })}
      >
        GST verified: {gstVerified ? "Yes — click to unverify" : "No — click to verify"}
      </button>
    </div>
  );
}
