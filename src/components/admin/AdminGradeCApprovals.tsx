"use client";

import { GRADE_CONFIG } from "@/constants/grading";
import type { ProductCondition } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = {
  id: string;
  sku: string;
  condition: ProductCondition;
  conditionNotes: string | null;
  refurbImages: string[];
  unitPrice: number;
  vendor: { id: string; companyName: string };
};

export function AdminGradeCApprovals({ listings }: { listings: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function approve(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}/approve`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "Failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function reject(id: string) {
    if (!confirm("Reject this listing? It will stay off the storefront.")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}/reject-grade-c`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "Failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (!listings.length) {
    return <p className="text-sm text-muted">No Grade C listings pending approval for this product.</p>;
  }

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-surface text-xs uppercase text-muted">
          <tr>
            <th className="px-3 py-2">Vendor</th>
            <th className="px-3 py-2">SKU</th>
            <th className="px-3 py-2">Condition</th>
            <th className="px-3 py-2">Notes</th>
            <th className="px-3 py-2">Photos</th>
            <th className="px-3 py-2">Price ₹</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {listings.map((l) => (
            <tr key={l.id}>
              <td className="px-3 py-2">
                <Link href={`/admin/vendors/${l.vendor.id}`} className="text-accent hover:underline">
                  {l.vendor.companyName}
                </Link>
              </td>
              <td className="px-3 py-2 font-mono text-xs">{l.sku}</td>
              <td className="px-3 py-2">
                <span className="font-medium">{GRADE_CONFIG[l.condition].dot} {GRADE_CONFIG[l.condition].label}</span>
              </td>
              <td className="max-w-[200px] px-3 py-2 text-xs text-muted">{l.conditionNotes ?? "—"}</td>
              <td className="px-3 py-2">
                <div className="flex gap-1">
                  {l.refurbImages.slice(0, 3).map((src, i) => (
                    <div key={i} className="relative h-10 w-10 overflow-hidden rounded border bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                  {l.refurbImages.length === 0 ? "—" : null}
                </div>
              </td>
              <td className="px-3 py-2">{l.unitPrice.toLocaleString("en-IN")}</td>
              <td className="space-x-2 px-3 py-2">
                <button
                  type="button"
                  disabled={busy === l.id}
                  className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                  onClick={() => void approve(l.id)}
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busy === l.id}
                  className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 disabled:opacity-50"
                  onClick={() => void reject(l.id)}
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
