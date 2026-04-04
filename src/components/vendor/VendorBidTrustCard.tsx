"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type Trust = {
  tier: "gold" | "silver" | "new";
  avgRating: number;
  reviewCount: number;
  orderCount: number;
  onTimePaymentRate: number;
};

export function VendorBidTrustCard({ bidId }: { bidId: string }) {
  const [data, setData] = useState<Trust | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/vendor/bids/${bidId}/customer-trust`);
        const j = await res.json();
        if (!res.ok) {
          if (!cancelled) setErr(j.error ?? "Could not load");
          return;
        }
        if (!cancelled) setData(j as Trust);
      } catch {
        if (!cancelled) setErr("Could not load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bidId]);

  if (err) return <p className="text-xs text-muted">Trust score unavailable.</p>;
  if (!data) return <p className="text-xs text-muted">Loading buyer trust…</p>;

  const tierLabel =
    data.tier === "gold"
      ? "Gold buyer — highly reliable"
      : data.tier === "silver"
        ? "Silver buyer — good track record"
        : "New buyer — limited history";

  const tone =
    data.tier === "gold"
      ? "border-amber-300 bg-amber-50 text-amber-950"
      : data.tier === "silver"
        ? "border-slate-300 bg-slate-50 text-slate-900"
        : "border-blue-200 bg-blue-50 text-blue-950";

  return (
    <div className={cn("rounded-xl border p-4 shadow-sm", tone)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Buyer profile</p>
      <p className="mt-2 text-sm font-semibold">{tierLabel}</p>
      <dl className="mt-3 space-y-1 text-xs text-slate-800">
        <div className="flex justify-between gap-2">
          <dt>Orders completed</dt>
          <dd className="font-medium">{data.orderCount}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>On-time payment</dt>
          <dd className="font-medium">{data.onTimePaymentRate}%</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Private vendor rating (avg)</dt>
          <dd className="font-medium">{data.avgRating.toFixed(1)} ★</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-muted">
        Based on past Rentfoxxy transactions. Use alongside your own judgment on this bid.
      </p>
    </div>
  );
}
