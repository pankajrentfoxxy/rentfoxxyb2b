"use client";

import { ConditionGuide } from "@/components/storefront/ConditionGuide";
import { LotDetailSkeleton } from "@/components/storefront/LotDetailSkeleton";
import { AsAsBidModal } from "@/components/sales/AsAsBidModal";
import { PaymentFlowModal } from "@/components/shared/PaymentFlowModal";
import { ConditionBadge } from "@/components/shared/ConditionBadge";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { PAYMENT_OPTIONS, type PaymentOptionId } from "@/constants/payment-options";
import { asAsPurchasePricing, lotPayNowAmount } from "@/lib/lot-asas-checkout";
import {
  AlertTriangle,
  Cpu,
  ChevronDown,
  ChevronUp,
  Download,
  HardDrive,
  MessageSquare,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

function groupItemsByBrand(items: any[]) {
  const m = new Map<string, any[]>();
  for (const it of items) {
    const arr = m.get(it.brand) ?? [];
    arr.push(it);
    m.set(it.brand, arr);
  }
  return Array.from(m.entries());
}

function primaryConditionForBrand(rows: any[]) {
  const tally = new Map<string, number>();
  for (const it of rows) {
    tally.set(it.condition, (tally.get(it.condition) ?? 0) + it.count);
  }
  let best = rows[0]?.condition ?? "";
  let max = -1;
  for (const [c, n] of Array.from(tally.entries())) {
    if (n > max) {
      max = n;
      best = c;
    }
  }
  return best;
}

export function AsAsSalesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { status } = useSession();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payOption, setPayOption] = useState<PaymentOptionId>("FULL");
  const [showBid, setShowBid] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [tab, setTab] = useState<"details" | "pivot" | "condition">("details");
  const [whyOpen, setWhyOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    void fetch(`/api/public/asas/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setListing(data && !data.error ? data : null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const grouped = useMemo(() => groupItemsByBrand(listing?.items ?? []), [listing?.items]);

  const brandCount = useMemo(() => {
    if (!listing?.items?.length) return 0;
    return new Set(listing.items.map((i: any) => i.brand)).size;
  }, [listing?.items]);

  const pivotColumnTotals = useMemo(() => {
    const conds = (listing?.pivotConditions ?? []) as string[];
    const rows = listing?.pivot ?? [];
    return conds.map((c) =>
      rows.reduce((s: number, row: Record<string, unknown>) => s + Number(row[c] ?? 0), 0),
    );
  }, [listing?.pivotConditions, listing?.pivot]);

  if (loading) return <LotDetailSkeleton />;
  if (!listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-medium">Listing not found</p>
        <Link href="/asas/listings" className="mt-4 inline-block text-accent hover:underline">
          ← All AsAs
        </Link>
      </div>
    );
  }

  const pivotConditions = (listing.pivotConditions ?? []) as string[];

  const sumRowTotals = (listing.pivot ?? []).reduce(
    (s: number, row: Record<string, unknown>) => s + Number(row.total ?? 0),
    0,
  );
  const sumColTotals = pivotColumnTotals.reduce((a, b) => a + b, 0);
  const authoritativeUnits = Number(
    listing.listingTotalUnits ?? listing.totalUnits ?? 0,
  );
  const pivotMismatch =
    sumRowTotals !== authoritativeUnits ||
    sumColTotals !== authoritativeUnits ||
    sumRowTotals !== sumColTotals;

  const qty = Math.max(0, listing.unitsAvailable ?? 0);
  const gstFull = asAsPurchasePricing(listing.avgUnitPrice, qty);
  const payNowAmount = lotPayNowAmount(gstFull.total, payOption);

  return (
    <div className="min-h-screen bg-surface">
      <div className="border-b border-white/8 bg-gradient-to-br from-[#3B0764] via-[#4C1D95] to-[#5B21B6] px-4 py-5">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <nav className="flex flex-wrap items-center gap-2 text-[11px] text-white/40">
              <Link href="/" className="hover:text-white">
                Home
              </Link>
              <span>/</span>
              <Link href="/asas/listings" className="hover:text-white">
                AsAs
              </Link>
              <span>/</span>
              <span className="truncate text-white/90">{listing.title}</span>
            </nav>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded border border-white/20 bg-white/12 px-2 py-1 text-[10px] text-white/80">
                🔄 AsAs DEAL
              </span>
              {listing.inspectorVerified ? <VerifiedBadge size="sm" /> : null}
              {listing.allowBidding ? (
                <span className="rounded border border-amber/25 bg-amber/15 px-2 py-1 text-[10px] text-amber">
                  💬 Bidding open
                </span>
              ) : null}
            </div>
            <h1 className="mb-2 mt-3 text-[18px] font-medium leading-snug text-white">{listing.title}</h1>
            {listing.highlights?.length ? (
              <ul className="mt-2 flex flex-wrap gap-3">
                {listing.highlights.map((h: string) => (
                  <li key={h} className="flex items-center gap-1.5 text-[11px] text-purple-200">
                    <span className="text-verified">✓</span>
                    {h}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="grid w-full max-w-md shrink-0 grid-cols-3 overflow-hidden rounded-xl border border-white/10 bg-white/8 lg:w-auto">
            {[
              { label: "Total Units", value: listing.totalUnits },
              { label: "Brands", value: brandCount },
              { label: "Buyer", value: "1 Only", sub: true },
            ].map(({ label, value, sub }) => (
              <div
                key={label}
                className="border-r border-white/10 px-4 py-3 text-center last:border-0"
              >
                <div
                  className={`text-[18px] font-medium ${sub ? "text-asas-border" : "text-amber"}`}
                >
                  {value}
                </div>
                <div className="mt-1 text-[9px] text-white/30">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl border-t border-border px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-border bg-white">
              <div className="flex overflow-x-auto border-b border-border bg-white px-4">
                {(
                  [
                    ["details", "📋 Full Details"],
                    ["pivot", "📊 Inventory Pivot"],
                    ["condition", "⭐ Condition Guide"],
                  ] as const
                ).map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTab(k)}
                    className={`whitespace-nowrap border-b-2 px-4 py-3 text-[12px] font-medium transition-colors ${
                      tab === k
                        ? "border-asas text-asas"
                        : "border-transparent text-ink-muted hover:text-ink-secondary"
                    }`}
                  >
                    {l}
                  </button>
                ))}
                <div className="ml-auto flex items-center pr-2">
                  <a
                    href={`/api/public/asas/${listing.id}/download-csv`}
                    download
                    className="my-2 rounded border border-asas/30 bg-asas-bg px-3 py-1 text-[10px] font-medium text-asas-text"
                  >
                    Download CSV
                  </a>
                </div>
              </div>
              <div className="bg-white p-4">
                {tab === "details" ? (
                  <div className="space-y-6">
                    {grouped.map(([brand, rows]) => (
                      <div key={brand}>
                        <h3 className="mb-2 font-medium text-ink-primary">{brand}</h3>
                        <div className="overflow-x-auto rounded-xl border border-border">
                          <table className="w-full text-sm">
                            <thead className="bg-navy text-[10px] font-medium uppercase tracking-wide text-white">
                              <tr>
                                <th className="px-3 py-2.5 text-left">Model</th>
                                <th className="px-3 py-2.5 text-left">CPU</th>
                                <th className="px-3 py-2.5 text-left">RAM</th>
                                <th className="px-3 py-2.5 text-left">Storage</th>
                                <th className="px-3 py-2.5 text-left">Grade</th>
                                <th className="px-3 py-2.5 text-center">Qty</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((item: any) => (
                                <tr key={item.id} className="border-t border-border bg-white odd:bg-surface">
                                  <td className="px-3 py-2.5 text-[11px]">
                                    <span className="font-medium text-ink-primary">{item.model}</span>
                                    {item.generation ? (
                                      <span className="text-[9px] text-ink-muted"> ({item.generation})</span>
                                    ) : null}
                                  </td>
                                  <td className="px-3 py-2 text-[11px] text-ink-secondary">
                                    <Cpu className="mr-1 inline h-3 w-3" />
                                    {item.processor}
                                  </td>
                                  <td className="px-3 py-2 text-[11px]">{item.ramGb}GB</td>
                                  <td className="px-3 py-2 text-[11px] text-ink-secondary">
                                    <HardDrive className="mr-1 inline h-3 w-3" />
                                    {item.storageGb} {item.storageType}
                                  </td>
                                  <td className="px-3 py-2">
                                    <ConditionBadge condition={item.condition} />
                                  </td>
                                  <td className="px-3 py-2 text-center text-[11px] font-medium text-ink-primary">
                                    {item.count}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {tab === "pivot" && !listing.pivot?.length ? (
                  <p className="text-sm text-ink-muted">No pivot data for this listing.</p>
                ) : null}

                {tab === "pivot" && listing.pivot?.length ? (
                  <div>
                    <h3 className="mb-3 font-medium text-ink-primary">Brand × Condition Distribution</h3>
                    <div className="overflow-x-auto rounded-xl border border-asas-border">
                      <table className="w-full text-sm">
                        <thead className="bg-navy text-white">
                          <tr className="text-[10px] uppercase tracking-wide">
                            <th className="px-3 py-2.5 text-left">Brand</th>
                            {pivotConditions.map((c: string) => (
                              <th key={c} className="px-2 py-2.5 text-center">
                                <ConditionBadge condition={c} />
                              </th>
                            ))}
                            <th className="px-3 py-2.5 text-center">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {listing.pivot.map((row: Record<string, unknown>, i: number) => (
                            <tr key={i} className="border-t border-border">
                              <td className="bg-surface px-3 py-2 text-left text-[11px] font-medium text-ink-primary">
                                {String(row.brand)}
                              </td>
                              {pivotConditions.map((c: string) => (
                                <td key={c} className="px-2 py-2 text-center text-[11px]">
                                  {Number(row[c] ?? 0) > 0 ? (
                                    <span className="font-medium text-asas">{String(row[c])}</span>
                                  ) : (
                                    <span className="text-ink-hint">—</span>
                                  )}
                                </td>
                              ))}
                              <td className="px-3 py-2 text-center text-[11px] font-bold">{String(row.total)}</td>
                            </tr>
                          ))}
                          <tr className="border-t border-border bg-navy text-white">
                            <td className="px-3 py-2.5 text-left text-[11px] font-medium">Total</td>
                            {pivotColumnTotals.map((n, idx) => (
                              <td key={pivotConditions[idx]} className="px-2 py-2.5 text-center text-[11px] font-medium text-asas-border">
                                {n}
                              </td>
                            ))}
                            <td className="px-3 py-2.5 text-center text-[11px] font-bold text-verified">
                              <span
                                className="inline-flex items-center justify-center gap-1"
                                title={
                                  pivotMismatch
                                    ? "Pivot sums don’t match the catalogue total (listing.totalUnits) or each other"
                                    : undefined
                                }
                              >
                                {authoritativeUnits}
                                {pivotMismatch ? (
                                  <AlertTriangle
                                    className="h-4 w-4 shrink-0 text-amber"
                                    aria-label="Pivot totals mismatch"
                                  />
                                ) : null}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-3 rounded-xl border border-amber-border bg-amber-bg p-3 text-[10px] text-amber-dark">
                      Exact units assigned by AI at dispatch to ensure fair brand/condition distribution.
                    </p>
                  </div>
                ) : null}

                {tab === "condition" ? <ConditionGuide /> : null}
              </div>
            </div>
          </div>

          <div className="h-fit space-y-4 border-l border-border bg-white p-4 lg:sticky lg:top-[50px]">
            <div className="rounded-xl bg-[#4C1D95] px-4 py-3">
              <div className="mb-1 text-[10px] font-medium uppercase tracking-widest text-purple-200">
                WHOLE LISTING PRICE
              </div>
              <div className="text-[24px] font-medium text-white">
                ₹{gstFull.subtotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
              <div className="mt-1 text-[11px] text-purple-300/60">
                + 18% GST = ₹{gstFull.gstAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-3">
              <div className="mb-2 text-[11px] font-medium text-ink-primary">All {qty} units:</div>
              <div className="space-y-2">
                {grouped.map(([brand, rows]) => {
                  const units = rows.reduce((s, it) => s + it.count, 0);
                  const cond = primaryConditionForBrand(rows);
                  return (
                    <div key={brand} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-ink-secondary">
                        {brand}{" "}
                        <span className="text-ink-muted">({units} units)</span>
                      </span>
                      <ConditionBadge condition={cond} />
                    </div>
                  );
                })}
              </div>
            </div>

            <a
              href={`/api/public/asas/${listing.id}/download-csv`}
              download
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-asas-border py-2.5 text-sm font-semibold text-asas-text hover:bg-asas-bg"
            >
              <Download className="h-4 w-4" />
              Download catalogue CSV
            </a>
            {listing.hasUploadedCsv ? (
              <a
                href={`/api/public/asas/${listing.id}/uploaded-csv`}
                download
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2.5 text-sm font-medium text-ink-secondary hover:bg-slate-100"
              >
                <Download className="h-4 w-4" />
                Download original upload
              </a>
            ) : null}

            <div>
              <label className="mb-2 block text-[11px] font-medium text-ink-primary">Payment</label>
              <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {PAYMENT_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer gap-3 rounded-xl border-2 p-3 text-sm ${
                      payOption === opt.id ? "border-asas bg-asas-bg" : "border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payopt-asas"
                      checked={payOption === opt.id}
                      onChange={() => setPayOption(opt.id as PaymentOptionId)}
                    />
                    <div>
                      <div className="font-semibold">{opt.label}</div>
                      <div className="text-xs text-ink-muted">{opt.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 rounded-xl bg-surface p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted">Subtotal</span>
                <span>₹{gstFull.subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">GST 18%</span>
                <span>₹{gstFull.gstAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-bold">
                <span>Total</span>
                <span>₹{gstFull.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
              </div>
              {payOption !== "FULL" ? (
                <div className="rounded-lg bg-amber-bg p-2 text-xs text-amber-dark">
                  <div className="flex justify-between font-semibold">
                    <span>Pay now</span>
                    <span>₹{payNowAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-ink-muted">
                    <span>Later</span>
                    <span>
                      ₹{(Math.round((gstFull.total - payNowAmount) * 100) / 100).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={qty <= 0}
                onClick={() => {
                  if (qty <= 0) return;
                  if (status !== "authenticated") {
                    router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/asas/listings/${listing.id}`)}`);
                    return;
                  }
                  setShowPay(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-asas py-3 font-medium text-white hover:bg-asas-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart className="h-5 w-5" />
                {qty <= 0 ? "Sold out" : "Buy Entire Listing"}
              </button>
              {listing.allowBidding ? (
                <button
                  type="button"
                  onClick={() => {
                    if (status !== "authenticated") {
                      router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/asas/listings/${listing.id}`)}`);
                      return;
                    }
                    setShowBid(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-asas py-2.5 font-medium text-asas hover:bg-asas-bg"
                >
                  <MessageSquare className="h-5 w-5" />
                  Negotiate Price (Bid)
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setWhyOpen((o) => !o)}
              className="flex w-full items-center justify-between rounded-xl bg-surface p-3 text-left"
            >
              <span className="text-[10px] font-medium text-ink-muted">Why AsAs?</span>
              {whyOpen ? <ChevronUp className="h-4 w-4 text-ink-muted" /> : <ChevronDown className="h-4 w-4 text-ink-muted" />}
            </button>
            {whyOpen ? (
              <p className="rounded-xl bg-surface p-3 text-[10px] leading-relaxed text-ink-muted">
                AsAs listings sell the entire fleet catalogue to one buyer — transparent mix, one invoice, and coordinated
                dispatch. Ideal when you want bulk volume without per-unit cherry-picking.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-1.5 border-t border-border-light pt-3">
              {["🛡 Verified catalogue", "📄 GST Invoice", "🔄 Fair dispatch"].map((b) => (
                <span key={b} className="rounded bg-surface px-2 py-1 text-[10px] text-ink-muted">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showBid ? (
        <AsAsBidModal listing={listing} quantity={qty} onClose={() => setShowBid(false)} />
      ) : null}
      {showPay ? (
        <PaymentFlowModal
          purchaseType="ASAS"
          listingId={listing.id}
          title={listing.title}
          quantity={qty}
          subtotalExGst={gstFull.subtotal}
          gstAmount={gstFull.gstAmount}
          grandTotal={gstFull.total}
          payOption={payOption}
          payNowAmount={payNowAmount}
          balanceLater={Math.round((gstFull.total - payNowAmount) * 100) / 100}
          onClose={() => setShowPay(false)}
        />
      ) : null}
    </div>
  );
}
