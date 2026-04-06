"use client";

import type { LotStatus, VerificationStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminAsAsActions({
  asasId,
  taskId,
  listingStatus,
  taskStatus,
}: {
  asasId: string;
  taskId: string | null;
  listingStatus: LotStatus;
  taskStatus: VerificationStatus | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function approveTask() {
    if (!taskId) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/verifications/${taskId}/approve`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) setErr(j.error ?? "Approve failed");
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function goLive() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/asas/${asasId}/go-live`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) setErr(j.error ?? "Go-live failed");
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
      {err ? <p className="text-sm text-red-700">{err}</p> : null}
      <p className="text-xs text-muted">
        Verification: {taskStatus ?? "—"} · Listing: {listingStatus}
      </p>
      <div className="flex flex-wrap gap-2">
        {taskId && taskStatus && taskStatus !== "APPROVED" ? (
          <button
            type="button"
            disabled={busy}
            onClick={approveTask}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Approve verification
          </button>
        ) : null}
        {listingStatus === "VERIFIED" ? (
          <button
            type="button"
            disabled={busy}
            onClick={goLive}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Go live
          </button>
        ) : null}
      </div>
    </div>
  );
}
