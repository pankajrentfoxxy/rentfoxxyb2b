"use client";

import type { Inspector, VerificationStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function VerificationConsoleActions({
  taskId,
  taskStatus,
  inspectors,
}: {
  taskId: string;
  taskStatus: VerificationStatus;
  inspectors: Inspector[];
}) {
  const router = useRouter();
  const [inspectorId, setInspectorId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function assign() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/verifications/${taskId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inspectorId: inspectorId || null }),
      });
      const j = await r.json();
      if (!r.ok) setErr(j.error ?? "Assign failed");
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
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

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      {err ? <p className="text-sm text-red-700">{err}</p> : null}
      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="font-medium text-slate-800">Assign inspector</span>
          <select
            className="mt-1 block w-64 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={inspectorId}
            onChange={(e) => setInspectorId(e.target.value)}
          >
            <option value="">— None —</option>
            {inspectors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={assign}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-60"
        >
          Save assignment
        </button>
      </div>
      {taskStatus !== "APPROVED" ? (
        <button
          type="button"
          disabled={busy}
          onClick={approve}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Approve listing (after inspection)
        </button>
      ) : (
        <p className="text-sm text-emerald-800">Approved.</p>
      )}
    </div>
  );
}
