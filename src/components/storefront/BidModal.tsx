"use client";

import { PAYMENT_OPTIONS, type PaymentOptionId } from "@/constants/payment-options";
import type { VendorPaymentFields } from "@/lib/vendor-payment-rules";
import { validateVendorBidPayment } from "@/lib/vendor-payment-rules";
import { BTN } from "@/constants/design";
import { cn } from "@/lib/utils";
import { Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

type ListingOpt = {
  id: string;
  label: string;
  unitPrice: number;
  stockQty: number;
  minOrderQty: number;
};

export function BidModal({
  open,
  onClose,
  productName,
  productSlug,
  listing,
}: {
  open: boolean;
  onClose: () => void;
  productName: string;
  productSlug: string;
  listing: ListingOpt | null;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [qty, setQty] = useState(listing?.minOrderQty ?? 1);
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [delivery, setDelivery] = useState("standard");
  const [payOpt, setPayOpt] = useState<PaymentOptionId>("FULL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payRules, setPayRules] = useState<VendorPaymentFields | null>(null);
  const [rulesLoading, setRulesLoading] = useState(false);

  const unit = Number(price) || 0;
  const savings = listing ? listing.unitPrice - unit : 0;
  const totalSave = savings * qty;
  const bidSubtotal = useMemo(() => (listing ? Math.round(qty * unit * 100) / 100 : 0), [listing, qty, unit]);

  useEffect(() => {
    if (!listing?.id) return;
    setStep(1);
    setPayRules(null);
  }, [listing?.id]);

  useEffect(() => {
    const listingId = listing?.id;
    if (!open || !listingId || step !== 2) return;
    let cancelled = false;
    setRulesLoading(true);
    fetch(`/api/public/listings/${listingId}/payment-constraints`)
      .then(async (r) => {
        const data = (await r.json()) as Partial<VendorPaymentFields> & { error?: string };
        if (cancelled) return;
        if (!r.ok || !Array.isArray(data.acceptedPaymentMethods)) {
          setPayRules(null);
          return;
        }
        setPayRules({
          acceptedPaymentMethods: data.acceptedPaymentMethods,
          requiresFullAdvance: !!data.requiresFullAdvance,
          minOrderForRTGS: data.minOrderForRTGS ?? null,
          minTokenPercentage: typeof data.minTokenPercentage === "number" ? data.minTokenPercentage : 2,
          acceptsTokenPayment: !!data.acceptsTokenPayment,
        });
      })
      .catch(() => {
        if (!cancelled) setPayRules(null);
      })
      .finally(() => {
        if (!cancelled) setRulesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, listing?.id, step]);

  useEffect(() => {
    if (!payRules || step !== 2) return;
    const cur = validateVendorBidPayment({
      vendor: payRules,
      paymentOption: payOpt,
      bidSubtotalExGst: bidSubtotal,
    });
    if (cur.ok) return;
    const first = PAYMENT_OPTIONS.find((o) =>
      validateVendorBidPayment({
        vendor: payRules,
        paymentOption: o.id,
        bidSubtotalExGst: bidSubtotal,
      }).ok,
    );
    if (first) setPayOpt(first.id);
  }, [payRules, bidSubtotal, step, payOpt]);

  if (!open || !listing) return null;

  const gstFactor = 1.18;
  const estTotalInclGst = Math.round(bidSubtotal * gstFactor * 100) / 100;

  const anyPayValid =
    payRules &&
    PAYMENT_OPTIONS.some((o) =>
      validateVendorBidPayment({
        vendor: payRules,
        paymentOption: o.id,
        bidSubtotalExGst: bidSubtotal,
      }).ok,
    );

  function closeAll() {
    setStep(1);
    setError(null);
    onClose();
  }

  async function submit() {
    const L = listing;
    if (!L) return;
    setError(null);
    if (status !== "authenticated") {
      router.push(`/auth/login?callbackUrl=/products/${encodeURIComponent(productSlug)}`);
      return;
    }
    if (unit <= 0) {
      setError("Enter your target price per unit.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/customer/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: L.id,
          quantity: qty,
          bidPricePerUnit: unit,
          note: note.slice(0, 200),
          deliveryPreference: delivery,
          paymentOption: payOpt,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not submit bid");
        return;
      }
      setStep(3);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={closeAll} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-medium text-ink-primary">
              {step === 3 ? "Bid submitted!" : step === 1 ? "Request Custom Price" : "Payment preference"}
            </h2>
            {step !== 3 ? (
              <>
                <p className="text-sm text-ink-muted">{productName}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {listing.label} · list ₹{listing.unitPrice.toLocaleString("en-IN")}
                </p>
              </>
            ) : null}
          </div>
          <button type="button" onClick={closeAll} className="rounded-lg p-1 hover:bg-surface">
            <X className="h-5 w-5 text-ink-muted" />
          </button>
        </div>

        {step === 3 ? (
          <div className="mt-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-verified-bg text-2xl text-verified-text">
              ✓
            </div>
            <p className="mt-4 text-sm text-ink-secondary">
              Check status in{" "}
              <Link href="/customer/bids" className="font-medium text-lot hover:underline">
                My Account → Bids
              </Link>
              .
            </p>
            <button type="button" className={`${BTN.ghost} mt-6 w-full`} onClick={closeAll}>
              Close
            </button>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Quantity</label>
              <input
                type="number"
                min={listing.minOrderQty}
                max={listing.stockQty}
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
              <p className="mt-1 text-xs text-muted">
                MOQ {listing.minOrderQty} · stock {listing.stockQty}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Your price per unit (₹)</label>
              <input
                type="number"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 82000"
              />
            </div>
            {unit > 0 && savings > 0 && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                You save approx. ₹{savings.toLocaleString("en-IN")} per unit · ₹
                {totalSave.toLocaleString("en-IN")} total vs. listed
              </p>
            )}
            <div>
              <label className="text-sm font-medium text-slate-700">Note (optional)</label>
              <textarea
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                rows={3}
                maxLength={200}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Delivery instructions or procurement context"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Delivery preference</label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
              >
                <option value="standard">Standard (5–7 business days)</option>
                <option value="express">Express (where available)</option>
                <option value="flexible">Flexible / project-based</option>
              </select>
            </div>
            {error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setError(null);
                if (unit <= 0) {
                  setError("Enter your target price per unit.");
                  return;
                }
                setStep(2);
              }}
              className={cn(BTN.primary, "flex h-11 w-full items-center justify-center disabled:opacity-50")}
            >
              Next →
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted">
              If your bid is approved, how would you like to pay? (Estimates include 18% GST on your bid
              subtotal.)
            </p>
            <p className="text-xs text-slate-600">
              Bid subtotal ≈ ₹{bidSubtotal.toLocaleString("en-IN")} · est. grand total ≈ ₹
              {estTotalInclGst.toLocaleString("en-IN")}
            </p>
            {rulesLoading ? (
              <p className="text-sm text-muted">Loading this option&apos;s payment rules…</p>
            ) : null}
            {!rulesLoading && payRules && !anyPayValid ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
                No payment choice is allowed for this bid size and the supplier&apos;s rules (for example, a large
                order may require NEFT/RTGS). Try a smaller quantity, another option on this product, or full payment
                if available.
              </p>
            ) : null}
            <div className="space-y-2">
              {PAYMENT_OPTIONS.map((opt) => {
                const sel = payOpt === opt.id;
                const check = payRules
                  ? validateVendorBidPayment({
                      vendor: payRules,
                      paymentOption: opt.id,
                      bidSubtotalExGst: bidSubtotal,
                    })
                  : { ok: false as const, error: rulesLoading ? "Loading…" : "Rules unavailable" };
                const allowed = check.ok;
                const tok =
                  opt.tokenPct < 100
                    ? Math.round(estTotalInclGst * (opt.tokenPct / 100) * 100) / 100
                    : estTotalInclGst;
                const bal = Math.round((estTotalInclGst - tok) * 100) / 100;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    title={!allowed && "error" in check ? check.error : undefined}
                    disabled={!allowed}
                    onClick={() => allowed && setPayOpt(opt.id)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-3 text-left text-sm transition",
                      !allowed && "cursor-not-allowed opacity-55",
                      sel && allowed
                        ? "border-primary bg-accent-light/50 ring-2 ring-primary/30"
                        : "border-slate-200 hover:bg-surface",
                    )}
                  >
                    <p className="font-semibold text-slate-900">{opt.label}</p>
                    <p className="mt-1 text-xs text-muted">{opt.description}</p>
                    {!allowed && "error" in check ? (
                      <p className="mt-2 text-xs text-red-800">{check.error}</p>
                    ) : null}
                    {allowed && opt.tokenPct < 100 ? (
                      <p className="mt-2 text-xs text-slate-700">
                        Pay now ≈ ₹{tok.toLocaleString("en-IN")} · Balance ≈ ₹{bal.toLocaleString("en-IN")}{" "}
                        within {opt.windowHours}h
                      </p>
                    ) : null}
                    {allowed && opt.tokenPct >= 100 ? (
                      <p className="mt-2 text-xs font-medium text-emerald-800">Recommended — single checkout</p>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              Token amounts are non-refundable if you miss the balance deadline after approval.
            </p>
            {error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-lg border border-slate-300 py-3 text-sm font-medium"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading || rulesLoading || !anyPayValid}
                onClick={submit}
                className={cn(
                  BTN.primary,
                  "flex flex-1 items-center justify-center py-3 disabled:opacity-50",
                )}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit Bid"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
