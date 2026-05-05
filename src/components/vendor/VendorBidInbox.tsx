"use client";

import { getPaymentOptionConfig, parsePaymentOption } from "@/constants/payment-options";
import { FilterTabChip } from "@/components/commonStyle/FilterTabChip";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type BidRow = {
  id: string;
  status: string;
  quantity: number;
  bidPricePerUnit: number;
  totalBidAmount: number;
  counterPrice: number | null;
  expiresAt: string | null;
  createdAt: string;
  listing: {
    id: string;
    sku: string;
    unitPrice: number;
    minBidPrice: number;
    product: { name: string; slug: string; brand: string };
  };
  customer: { companyName: string | null; gstin: string | null };
  marginImpactPct: number;
  paymentOption: string;
};

const TABS = ["ALL", "PENDING", "APPROVED", "COUNTER_OFFERED", "REJECTED"] as const;

export function VendorBidInbox() {
  const [tab, setTab] = useState<string>("ALL");
  const [rows, setRows] = useState<BidRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [modal, setModal] = useState<
    | null
    | { bid: BidRow; kind: "approve" | "reject" | "counter" }
  >(null);
  const [hours, setHours] = useState(48);
  const [counterPrice, setCounterPrice] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/bids?tab=${encodeURIComponent(tab)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { bids: BidRow[] };
      setRows(data.bids ?? []);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitAction() {
    if (!modal) return;
    setBusyId(modal.bid.id);
    try {
      const body: Record<string, unknown> = { action: modal.kind };
      if (modal.kind === "approve") body.expiresInHours = hours;
      if (modal.kind === "reject") body.rejectReason = rejectReason.trim() || undefined;
      if (modal.kind === "counter") body.counterPrice = Number(counterPrice);
      const res = await fetch(`/api/vendor/bids/${modal.bid.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed");
        return;
      }
      setModal(null);
      setRejectReason("");
      setCounterPrice("");
      load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-2">
        {TABS.map((t) => (
          <FilterTabChip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t === "ALL" ? "All" : t.replace(/_/g, " ")}
          </FilterTabChip>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading bids…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">No bids in this tab.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((b) => (
            <li
              key={b.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{b.listing.product.name}</p>
                  <p className="text-xs text-muted">
                    {b.listing.product.brand} · SKU {b.listing.sku}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    Qty {b.quantity} · Bid ₹{b.bidPricePerUnit.toLocaleString("en-IN")}/unit · Total ₹
                    {b.totalBidAmount.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-muted">
                    Buyer: {b.customer.companyName ?? "—"}
                    {b.customer.gstin ? ` · GSTIN ${b.customer.gstin}` : ""}
                  </p>
                  <p className="text-xs text-slate-700">
                    Pay preference: {getPaymentOptionConfig(parsePaymentOption(b.paymentOption)).label}
                  </p>
                  <p className="text-xs text-muted">
                    vs your list ₹{b.listing.unitPrice.toLocaleString("en-IN")} · margin impact{" "}
                    <span className={b.marginImpactPct < 0 ? "text-rose-600" : "text-emerald-700"}>
                      {b.marginImpactPct > 0 ? "+" : ""}
                      {b.marginImpactPct}%
                    </span>
                  </p>
                  {b.counterPrice ? (
                    <p className="text-xs font-medium text-amber-800">
                      Your counter: ₹{b.counterPrice.toLocaleString("en-IN")}/unit
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-slate-700">
                    {b.status}
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    <Link href={`/vendor/bids/${b.id}`} className="text-xs font-medium text-teal-800 hover:underline">
                      Buyer trust · detail
                    </Link>
                    <Link href={`/products/${b.listing.product.slug}`} className="text-xs text-accent hover:underline" target="_blank">
                      View listing
                    </Link>
                  </div>
                  {b.status === "PENDING" && (
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        disabled={busyId === b.id}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        onClick={() => {
                          setHours(48);
                          setModal({ bid: b, kind: "approve" });
                        }}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === b.id}
                        className="rounded-lg border border-amber-500 px-3 py-1.5 text-xs font-semibold text-amber-900 disabled:opacity-50"
                        onClick={() => {
                          setCounterPrice(String(Math.max(b.listing.minBidPrice, b.bidPricePerUnit)));
                          setModal({ bid: b, kind: "counter" });
                        }}
                      >
                        Counter
                      </button>
                      <button
                        type="button"
                        disabled={busyId === b.id}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        onClick={() => {
                          setRejectReason("");
                          setModal({ bid: b, kind: "reject" });
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modal ? (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            {modal.kind === "approve" ? (
              <>
                <h3 className="text-lg font-semibold text-slate-900">Approve bid</h3>
                <p className="mt-2 text-sm text-muted">
                  Customer must pay before approval expires. Default 48h — you can choose 24, 48, 72, or up to 168h.
                </p>
                <label className="mt-4 block text-sm font-medium text-slate-700">
                  Expires in (hours)
                  <input
                    type="number"
                    min={1}
                    max={168}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                  />
                </label>
              </>
            ) : null}
            {modal.kind === "reject" ? (
              <>
                <h3 className="text-lg font-semibold text-slate-900">Decline bid</h3>
                <p className="mt-2 text-sm text-muted">Optional internal note (not shown to buyer).</p>
                <textarea
                  className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </>
            ) : null}
            {modal.kind === "counter" ? (
              <>
                <h3 className="text-lg font-semibold text-slate-900">Counter-offer (per unit)</h3>
                <p className="mt-2 text-sm text-muted">
                  Minimum allowed: ₹{modal.bid.listing.minBidPrice.toLocaleString("en-IN")}
                </p>
                <input
                  type="number"
                  className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                />
              </>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border px-4 py-2 text-sm"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!!busyId}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                onClick={submitAction}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
