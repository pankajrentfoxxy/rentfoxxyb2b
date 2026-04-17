"use client";

import { ConditionGuide } from "@/components/storefront/ConditionGuide";
import { LotDetailSkeleton } from "@/components/storefront/LotDetailSkeleton";
import { LotBidModal } from "@/components/sales/LotBidModal";
import { PaymentFlowModal } from "@/components/shared/PaymentFlowModal";
import { ConditionBadge } from "@/components/shared/ConditionBadge";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { PAYMENT_OPTIONS, type PaymentOptionId } from "@/constants/payment-options";
import { lotPayNowAmount, lotPurchasePricing } from "@/lib/lot-asas-checkout";
import {
  ChevronDown,
  ChevronUp,
  Cpu,
  Download,
  HardDrive,
  MessageSquare,
  Monitor,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function LotSalesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { status } = useSession();
  const [lot, setLot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lotsQty, setLotsQty] = useState(1);
  const [payOption, setPayOption] = useState<PaymentOptionId>("FULL");
  const [showBidModal, setShowBidModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);
  const [activeTab, setActiveTab] = useState<"inventory" | "simulator" | "condition">("inventory");

  useEffect(() => {
    if (!id) return;
    void fetch(`/api/public/lots/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setLot(data && !data.error ? data : null);
        if (data?.lotsRemaining) setLotsQty(1);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (lot?.lotsRemaining) {
      setLotsQty((q) => Math.min(q, lot.lotsRemaining));
    }
  }, [lot]);

  if (loading) return <LotDetailSkeleton />;
  if (!lot) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-medium text-slate-800">Lot not found</p>
        <Link href="/sales/lots" className="mt-4 inline-block text-accent hover:underline">
          ← All lots
        </Link>
      </div>
    );
  }

  const totalPrice = lotsQty * lot.pricePerLot;
  const gst = totalPrice * 0.18;
  const grandTotal = totalPrice + gst;

  const pricing = lotPurchasePricing(lot.pricePerLot, lotsQty);
  const payNowFromLib = lotPayNowAmount(pricing.total, payOption);

  return (
    <div className="min-h-screen bg-surface">
      <div className="border-b border-white/6 bg-gradient-to-br from-navy via-navy to-[#0F2040] px-4 py-5">
        <div className="mx-auto max-w-7xl">
          <nav className="flex flex-wrap items-center gap-2 text-[11px] text-white/40">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span>/</span>
            <Link href="/sales/lots" className="hover:text-white">
              Lot sales
            </Link>
            <span>/</span>
            <span className="truncate font-medium text-white/90">{lot.title}</span>
          </nav>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded border border-amber/30 bg-amber/15 px-2 py-1 text-[10px] font-medium text-amber">
              🔥 LOT SALE
            </span>
            {lot.inspectorVerified ? <VerifiedBadge size="sm" /> : null}
            {lot.percentSold > 70 ? (
              <span className="rounded border border-red-500/20 bg-red-500/15 px-2 py-1 text-[10px] font-medium text-red-300">
                {lot.lotsRemaining} lots left!
              </span>
            ) : null}
          </div>
          <h1 className="mb-2 mt-3 text-[18px] font-medium leading-snug text-white">{lot.title}</h1>
          {lot.description ? (
            <p className="max-w-[500px] text-[12px] leading-relaxed text-white/45">{lot.description}</p>
          ) : null}
          <div className="mt-4 flex w-fit flex-wrap gap-0 overflow-hidden rounded-lg border border-white/10">
            {[
              { label: "Total Lots", value: lot.totalLots },
              { label: "Sold", value: lot.lotsSold },
              { label: "Remaining", value: lot.lotsRemaining },
              { label: "Units/Lot", value: lot.lotSize },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="border-r border-white/10 px-5 py-3 text-center last:border-r-0"
              >
                <div className="text-[18px] font-medium text-amber">{value}</div>
                <div className="mt-1 text-[9px] text-white/30">{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 max-w-md">
            <div className="mb-1.5 flex justify-between text-[10px] text-white/35">
              <span>
                {lot.lotsSold} of {lot.totalLots} lots sold
              </span>
              <span>{lot.percentSold}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/8">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  lot.percentSold > 70 ? "bg-red-500" : "bg-gradient-to-r from-lot to-amber"
                }`}
                style={{ width: `${lot.percentSold}%` }}
              />
            </div>
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
                    ["inventory", "📦 Full Inventory"],
                    ["simulator", "🧮 Lot Simulator"],
                    ["condition", "⭐ Condition Guide"],
                  ] as const
                ).map(([tabId, label]) => (
                  <button
                    key={tabId}
                    type="button"
                    onClick={() => setActiveTab(tabId)}
                    className={`whitespace-nowrap border-b-2 px-4 py-3 text-[12px] font-medium transition-colors ${
                      activeTab === tabId
                        ? "border-navy text-navy"
                        : "border-transparent text-ink-muted hover:text-ink-secondary"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <div className="ml-auto flex items-center pr-2">
                  <a
                    href={`/api/public/lots/${lot.id}/download-csv`}
                    download
                    className="my-2 rounded border border-lot/30 bg-lot-bg px-3 py-1 text-[10px] font-medium text-lot"
                  >
                    Download CSV
                  </a>
                </div>
              </div>
              <div className="bg-white p-4">
                {activeTab === "inventory" ? (
                  <div>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-bold text-primary">Inventory breakdown</h2>
                        <p className="text-sm text-muted">Specifications per line item</p>
                      </div>
                      <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                        {lot.totalUnits} units
                      </span>
                    </div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {lot.brandBreakdown?.map((b: any) => (
                        <div
                          key={b.brand}
                          className="flex items-center gap-2 rounded-lg border border-lot-border bg-lot-bg px-3 py-1.5"
                        >
                          <span className="text-[11px] font-medium text-ink-primary">{b.brand}</span>
                          <span className="rounded-full bg-lot px-2 py-0.5 text-[10px] font-medium text-white">
                            {b.count} · {b.pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-sm">
                        <thead className="bg-navy text-[10px] font-medium uppercase tracking-wide text-white">
                          <tr>
                            {["Brand", "Model", "CPU", "RAM", "Storage", "Display", "OS", "Grade", "Qty", "₹/u"].map(
                              (h) => (
                                <th key={h} className="whitespace-nowrap px-3 py-2.5 text-left">
                                  {h}
                                </th>
                              ),
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {(showAllItems ? lot.items : lot.items.slice(0, 8)).map((item: any, i: number) => (
                            <tr key={item.id ?? i} className={i % 2 === 0 ? "bg-white" : "bg-surface"}>
                              <td className="whitespace-nowrap px-3 py-2 font-semibold text-primary">{item.brand}</td>
                              <td className="whitespace-nowrap px-3 py-2">
                                {item.model}
                                {item.generation ? (
                                  <span className="ml-1 text-xs text-muted">({item.generation})</span>
                                ) : null}
                              </td>
                              <td className="px-3 py-2 text-xs">
                                <span className="inline-flex items-center gap-1">
                                  <Cpu className="h-3 w-3" />
                                  {item.processor}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-2">{item.ramGb}GB</td>
                              <td className="whitespace-nowrap px-3 py-2 text-xs">
                                <span className="inline-flex items-center gap-1">
                                  <HardDrive className="h-3 w-3" />
                                  {item.storageGb} {item.storageType}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-xs">
                                <Monitor className="mr-1 inline h-3 w-3" />
                                {item.displayInch}&quot;
                              </td>
                              <td className="px-3 py-2 text-xs text-muted">{item.os}</td>
                              <td className="px-3 py-2">
                                <ConditionBadge condition={item.condition} />
                              </td>
                              <td className="px-3 py-2 text-center font-bold">{item.count}</td>
                              <td className="whitespace-nowrap px-3 py-2 text-right font-medium text-verified-text">
                                ₹{item.unitPrice.toLocaleString("en-IN")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {lot.items.length > 8 ? (
                      <button
                        type="button"
                        onClick={() => setShowAllItems(!showAllItems)}
                        className="mt-3 flex w-full items-center justify-center gap-2 text-sm font-semibold text-accent hover:underline"
                      >
                        {showAllItems ? (
                          <>
                            <ChevronUp className="h-4 w-4" /> Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" /> Show all {lot.items.length} models
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {activeTab === "simulator" ? (
                  <div>
                    <h2 className="mb-1 text-lg font-bold text-primary">What will you receive?</h2>
                    <p className="mb-5 text-sm text-muted">
                      Proportional mix approximates fleet composition for the lots you buy.
                    </p>
                    <div className="mb-5 rounded-2xl bg-accent/5 p-5">
                      <label className="mb-2 block text-sm font-semibold text-primary">
                        Lots: <span className="text-lg text-accent">{lotsQty}</span>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={lot.lotsRemaining}
                        value={lotsQty}
                        onChange={(e) => setLotsQty(Number(e.target.value))}
                        className="w-full accent-accent"
                      />
                      <div className="mt-1 flex justify-between text-xs text-muted">
                        <span>
                          1 lot ({lot.lotSize} units)
                        </span>
                        <span>
                          Max {lot.lotsRemaining} ({lot.lotsRemaining * lot.lotSize} units)
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <div className="border-b border-slate-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900">
                        Approximate allocation
                      </div>
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs text-muted">
                          <tr>
                            <th className="px-4 py-2 text-left">Model</th>
                            <th className="px-4 py-2 text-left">Specs</th>
                            <th className="px-4 py-2">Grade</th>
                            <th className="px-4 py-2 text-center">Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lot.items.map((item: any, i: number) => {
                            const u = Math.round((item.count / lot.totalUnits) * (lotsQty * lot.lotSize));
                            if (u === 0) return null;
                            return (
                              <tr key={item.id ?? i} className="border-t border-slate-100">
                                <td className="px-4 py-2">
                                  <div className="font-semibold text-primary">{item.brand}</div>
                                  <div className="text-xs text-muted">{item.model}</div>
                                </td>
                                <td className="px-4 py-2 text-xs text-muted">
                                  {item.ramGb}GB · {item.storageGb}GB {item.storageType}
                                  <br />
                                  {item.processor}
                                </td>
                                <td className="px-4 py-2">
                                  <ConditionBadge condition={item.condition} />
                                </td>
                                <td className="px-4 py-2 text-center text-lg font-bold text-accent">~{u}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-800">
                        Quantities are indicative; final pick list is confirmed at dispatch.
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeTab === "condition" ? <ConditionGuide /> : null}
              </div>
            </div>
          </div>

          <div className="h-fit space-y-4 border-l border-border bg-white p-4 lg:sticky lg:top-[50px]">
            <div className="space-y-5">
              <div>
                <div className="text-[11px] text-ink-muted">Price per lot</div>
                <div className="text-[26px] font-medium text-ink-primary">
                  ₹{lot.pricePerLot.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-ink-muted">
                  {lot.lotSize} units per lot · ≈ ₹
                  {Math.round(lot.pricePerLot / lot.lotSize).toLocaleString("en-IN")}/unit avg
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Lots</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border text-xl"
                    onClick={() => setLotsQty((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold">{lotsQty}</div>
                    <div className="text-xs text-muted">{lotsQty * lot.lotSize} laptops</div>
                  </div>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border text-xl"
                    onClick={() => setLotsQty((q) => Math.min(lot.lotsRemaining, q + 1))}
                  >
                    +
                  </button>
                </div>
                <p className="mt-1 text-center text-xs text-muted">{lot.lotsRemaining} lots available</p>
              </div>
              <div className="space-y-2">
                <a
                  href={`/api/public/lots/${lot.id}/download-csv`}
                  download
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" />
                  Download catalogue CSV
                </a>
                {lot.hasUploadedCsv ? (
                  <a
                    href={`/api/public/lots/${lot.id}/uploaded-csv`}
                    download
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-100"
                  >
                    <Download className="h-4 w-4" />
                    Download original upload
                  </a>
                ) : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Payment</label>
                <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex cursor-pointer gap-3 rounded-xl border-2 p-3 text-sm ${
                        payOption === opt.id ? "border-accent bg-accent/5" : "border-slate-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payopt"
                        checked={payOption === opt.id}
                        onChange={() => setPayOption(opt.id as PaymentOptionId)}
                      />
                      <div>
                        <div className="font-semibold">{opt.label}</div>
                        <div className="text-xs text-muted">{opt.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">GST 18%</span>
                  <span>₹{gst.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Total</span>
                  <span>₹{grandTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                </div>
                {payOption !== "FULL" ? (
                  <div className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
                    <div className="flex justify-between font-semibold">
                      <span>Pay now</span>
                      <span>₹{payNowFromLib.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="mt-1 flex justify-between text-muted">
                      <span>Later</span>
                      <span>₹{round2(grandTotal - payNowFromLib).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    if (status !== "authenticated") {
                      router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/sales/lots/${lot.id}`)}`);
                      return;
                    }
                    if (lot.lotsRemaining <= 0) return;
                    setShowPayModal(true);
                  }}
                  disabled={lot.lotsRemaining <= 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 font-bold text-white disabled:opacity-50"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {payOption === "FULL" ? "Buy now" : "Pay token & reserve"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (status !== "authenticated") {
                      router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/sales/lots/${lot.id}`)}`);
                      return;
                    }
                    setShowBidModal(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-accent py-3 font-bold text-accent"
                >
                  <MessageSquare className="h-5 w-5" />
                  Negotiate (bid)
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border-light pt-3">
                {["🛡 Verified lot", "📄 GST Invoice", "🔄 Fair dispatch"].map((b) => (
                  <span key={b} className="rounded bg-surface px-2 py-1 text-[10px] text-ink-muted">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBidModal ? (
        <LotBidModal lot={lot} lotsQty={lotsQty} onClose={() => setShowBidModal(false)} />
      ) : null}
      {showPayModal ? (
        <PaymentFlowModal
          purchaseType="LOT"
          listingId={lot.id}
          title={lot.title}
          quantity={lotsQty}
          lotSize={lot.lotSize}
          subtotalExGst={totalPrice}
          gstAmount={gst}
          grandTotal={grandTotal}
          payOption={payOption}
          payNowAmount={payNowFromLib}
          balanceLater={round2(grandTotal - payNowFromLib)}
          onClose={() => setShowPayModal(false)}
        />
      ) : null}
    </div>
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
