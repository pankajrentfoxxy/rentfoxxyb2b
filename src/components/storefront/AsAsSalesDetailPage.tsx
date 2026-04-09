"use client";

import { ConditionGuide } from "@/components/storefront/ConditionGuide";
import { LotDetailSkeleton } from "@/components/storefront/LotDetailSkeleton";
import { AsAsBidModal } from "@/components/sales/AsAsBidModal";
import { PaymentFlowModal } from "@/components/shared/PaymentFlowModal";
import { ConditionBadge } from "@/components/shared/ConditionBadge";
import { PAYMENT_OPTIONS, type PaymentOptionId } from "@/constants/payment-options";
import { asAsPurchasePricing, lotPayNowAmount } from "@/lib/lot-asas-checkout";
import { Cpu, HardDrive, MessageSquare, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

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

export function AsAsSalesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { status } = useSession();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [payOption, setPayOption] = useState<PaymentOptionId>("FULL");
  const [showBid, setShowBid] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [tab, setTab] = useState<"details" | "pivot" | "condition">("details");

  useEffect(() => {
    if (!id) return;
    void fetch(`/api/public/asas/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setListing(data && !data.error ? data : null);
        if (data?.unitsAvailable) setQty(1);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (listing?.unitsAvailable) {
      setQty((q) => Math.min(q, listing.unitsAvailable));
    }
  }, [listing]);

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

  const subtotal = listing.avgUnitPrice * qty;
  const gst = subtotal * 0.18;
  const grandTotal = subtotal + gst;
  const gstFull = asAsPurchasePricing(listing.avgUnitPrice, qty);
  const payNowAmount = lotPayNowAmount(gstFull.total, payOption);

  const grouped = groupItemsByBrand(listing.items ?? []);

  return (
    <div className="min-h-screen bg-slate-50/80">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 text-sm text-muted">
          <Link href="/" className="hover:text-accent">
            Home
          </Link>
          <span> / </span>
          <Link href="/asas/listings" className="hover:text-accent">
            AsAs
          </Link>
          <span> / </span>
          <span className="text-primary">{listing.title}</span>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="bg-gradient-to-r from-purple-700 to-indigo-600 p-6 text-white">
                <h1 className="text-2xl font-bold">{listing.title}</h1>
                <ul className="mt-3 space-y-1 text-sm text-white/90">
                  {listing.highlights?.map((h: string) => (
                    <li key={h}>✓ {h}</li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t p-4 sm:grid-cols-4">
                {listing.isLotMode && listing.totalLots ? (
                  <>
                    <div>
                      <div className="text-xs text-muted">Lots</div>
                      <div className="font-bold">
                        {listing.lotsSold ?? 0} / {listing.totalLots} sold
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">Lots left</div>
                      <div className="font-bold">{listing.lotsRemaining ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">Units in catalogue</div>
                      <div className="font-bold">{listing.totalUnits}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">~Units / lot</div>
                      <div className="font-bold">{listing.lotSize ?? "—"}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="text-xs text-muted">Units</div>
                      <div className="font-bold">{listing.totalUnits}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">Available</div>
                      <div className="font-bold">{listing.unitsAvailable}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">Avg / unit</div>
                      <div className="font-bold">~₹{listing.avgUnitPrice.toLocaleString("en-IN")}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">Bidding</div>
                      <div className="font-bold">{listing.allowBidding ? "Open" : "Closed"}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-white">
              <div className="flex border-b">
                {(
                  [
                    ["details", "Full details"],
                    ["pivot", "Brand × grade"],
                    ["condition", "Condition guide"],
                  ] as const
                ).map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTab(k)}
                    className={`flex-1 py-3 text-sm font-semibold ${
                      tab === k ? "border-b-2 border-purple-600 text-purple-700" : "text-muted"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div className="p-6">
                {tab === "details" ? (
                  <div className="space-y-6">
                    {grouped.map(([brand, rows]) => (
                      <div key={brand}>
                        <h3 className="mb-2 font-bold text-primary">{brand}</h3>
                        <div className="overflow-x-auto rounded-lg border">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-100">
                              <tr>
                                <th className="px-2 py-2 text-left">Model</th>
                                <th className="px-2 py-2">CPU</th>
                                <th className="px-2 py-2">RAM</th>
                                <th className="px-2 py-2">Storage</th>
                                <th className="px-2 py-2">Grade</th>
                                <th className="px-2 py-2">Qty</th>
                                <th className="px-2 py-2 text-right">Est ₹</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((item: any) => (
                                <tr key={item.id} className="border-t">
                                  <td className="px-2 py-2">
                                    {item.model}
                                    {item.generation ? (
                                      <span className="text-xs text-muted"> ({item.generation})</span>
                                    ) : null}
                                  </td>
                                  <td className="px-2 py-2 text-xs">
                                    <Cpu className="mr-1 inline h-3 w-3" />
                                    {item.processor}
                                  </td>
                                  <td className="px-2 py-2">{item.ramGb}</td>
                                  <td className="px-2 py-2 text-xs">
                                    <HardDrive className="mr-1 inline h-3 w-3" />
                                    {item.storageGb} {item.storageType}
                                  </td>
                                  <td className="px-2 py-2">
                                    <ConditionBadge condition={item.condition} />
                                  </td>
                                  <td className="px-2 py-2 text-center font-medium">{item.count}</td>
                                  <td className="px-2 py-2 text-right">
                                    ₹{item.estimatedValue.toLocaleString("en-IN")}
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
                {tab === "pivot" && listing.pivot?.length ? (
                  <div className="overflow-x-auto">
                    <h3 className="mb-3 font-bold">Brand × condition</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="px-3 py-2 text-left">Brand</th>
                          {(listing.pivotConditions as string[]).map((c: string) => (
                            <th key={c} className="px-2 py-2 text-center">
                              <ConditionBadge condition={c} />
                            </th>
                          ))}
                          <th className="px-3 py-2 text-center">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listing.pivot.map((row: Record<string, unknown>, i: number) => (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-2 font-semibold text-primary">{String(row.brand)}</td>
                            {(listing.pivotConditions as string[]).map((c: string) => (
                              <td key={c} className="px-2 py-2 text-center">
                                {Number(row[c] ?? 0) > 0 ? (
                                  <span className="font-bold text-accent">{String(row[c])}</span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            ))}
                            <td className="px-3 py-2 text-center font-bold">{String(row.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
                      Mix is proportional — allocation is finalized at dispatch.
                    </p>
                  </div>
                ) : null}
                {tab === "condition" ? <ConditionGuide /> : null}
              </div>
            </div>
          </div>

          <div className="h-fit lg:sticky lg:top-6">
            <div className="space-y-4 rounded-2xl border bg-white p-5">
              <div>
                <div className="text-2xl font-bold">~₹{listing.avgUnitPrice.toLocaleString("en-IN")}</div>
                <div className="text-sm text-muted">per unit (avg) · {listing.unitsAvailable} left</div>
              </div>
              <div>
                <label className="text-sm font-semibold">Units</label>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    className="h-10 w-10 rounded-lg border"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <span className="text-xl font-bold">{qty}</span>
                  <button
                    type="button"
                    className="h-10 w-10 rounded-lg border"
                    onClick={() => setQty((q) => Math.min(listing.unitsAvailable, q + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="max-h-40 space-y-2 overflow-y-auto">
                {PAYMENT_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer gap-2 rounded-lg border p-2 text-sm ${
                      payOption === opt.id ? "border-purple-500 bg-purple-50" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      checked={payOption === opt.id}
                      onChange={() => setPayOption(opt.id as PaymentOptionId)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST</span>
                  <span>₹{gst.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="mt-1 flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{grandTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (status !== "authenticated") {
                    router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/asas/listings/${listing.id}`)}`);
                    return;
                  }
                  setShowPay(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 font-bold text-white"
              >
                <ShoppingCart className="h-5 w-5" />
                Buy now
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
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-purple-600 py-3 font-bold text-purple-700"
                >
                  <MessageSquare className="h-5 w-5" />
                  Negotiate (bid)
                </button>
              ) : null}
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
