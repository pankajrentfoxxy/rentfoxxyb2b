"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban, CheckCircle2, XCircle } from "lucide-react";

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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
          Account controls
        </h2>
      </div>
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase px-1">User identity</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => patch({ isVerified: !isVerified })}
            className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border disabled:opacity-50 disabled:pointer-events-none ${
              isVerified
                ? "bg-white text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                : "bg-green-600 text-white border-transparent hover:bg-green-700"
            }`}
          >
            {isVerified ? (
              <>
                <XCircle size={14} /> Revoke verification
              </>
            ) : (
              <>
                <CheckCircle2 size={14} /> Verify identity
              </>
            )}
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase px-1">GST verification</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => patch({ gstVerified: !gstVerified })}
            className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border disabled:opacity-50 disabled:pointer-events-none ${
              gstVerified
                ? "bg-white text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                : "bg-green-600 text-white border-transparent hover:bg-green-700"
            }`}
          >
            {gstVerified ? (
              <>
                <XCircle size={14} /> Unverify GST
              </>
            ) : (
              <>
                <CheckCircle2 size={14} /> Approve GST
              </>
            )}
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled
            title="Suspend is not configured for customers yet."
            className="w-full py-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-100 flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
          >
            <Ban size={16} />
            Suspend customer
          </button>
        </div>
      </div>
    </div>
  );
}
