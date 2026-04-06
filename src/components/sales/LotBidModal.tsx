"use client";

import { PAYMENT_OPTIONS } from "@/constants/payment-options";
import { CheckCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function LotBidModal({
  lot,
  lotsQty: initialQty,
  onClose,
}: {
  lot: any;
  lotsQty: number;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [lotsQty, setLotsQty] = useState(initialQty);
  const [bidPricePerLot, setBidPricePerLot] = useState(
    Math.round(lot.pricePerLot * 0.92),
  );
  const [note, setNote] = useState("");
  const [payOption, setPayOption] = useState("FULL");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const floor = lot.pricePerLot * 0.5;
  const totalBid = lotsQty * bidPricePerLot;
  const listTotal = lotsQty * lot.pricePerLot;
  const savings = listTotal - totalBid;

  async function submit() {
    if (session?.user?.role !== "CUSTOMER") {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/sales/lots/${lot.id}`)}`);
      return;
    }
    if (bidPricePerLot < floor) {
      setErr(`Minimum offer is ₹${Math.ceil(floor).toLocaleString("en-IN")} per lot`);
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch("/api/customer/lot-bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotId: lot.id,
          lotsCount: lotsQty,
          bidPricePerLot,
          paymentOption: payOption,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Submit failed");
        return;
      }
      setStep(3);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <button type="button" onClick={onClose} className="text-sm text-muted hover:text-primary">
            Close
          </button>
        </div>
        {step === 1 ? (
          <div className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-bold text-primary">Request a custom price</h2>
              <p className="mt-1 text-sm text-muted">
                Your bid goes to Rentfoxxy. Typical response within 24–48 hours.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-800">Number of lots</label>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border text-xl"
                  onClick={() => setLotsQty((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="text-xl font-bold">{lotsQty}</span>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border text-xl"
                  onClick={() => setLotsQty((q) => Math.min(lot.lotsRemaining, q + 1))}
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-800">Your price per lot (₹)</label>
              <input
                type="number"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={bidPricePerLot}
                min={floor}
                onChange={(e) => setBidPricePerLot(Number(e.target.value) || 0)}
              />
              {bidPricePerLot < floor ? (
                <p className="mt-1 text-xs text-red-600">Below minimum bid (50% of list).</p>
              ) : (
                <p className="mt-1 text-xs text-muted">
                  Total bid ₹{totalBid.toLocaleString("en-IN")} · Save ₹
                  {Math.max(0, savings).toLocaleString("en-IN")} vs list
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-800">Note (optional)</label>
              <textarea
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={3}
                maxLength={300}
                placeholder="Context for your procurement team…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            {err ? <p className="text-sm text-red-600">{err}</p> : null}
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full rounded-xl bg-primary py-3 font-semibold text-white"
            >
              Next: payment preference
            </button>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="space-y-4 p-5">
            <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-accent">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <h2 className="text-lg font-bold text-primary">If approved, how will you pay?</h2>
            <div className="space-y-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 ${
                    payOption === opt.id ? "border-accent bg-accent/5" : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="pay"
                    checked={payOption === opt.id}
                    onChange={() => setPayOption(opt.id)}
                  />
                  <div>
                    <div className="text-sm font-semibold">{opt.label}</div>
                    <div className="text-xs text-muted">{opt.description}</div>
                  </div>
                </label>
              ))}
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit()}
              className="w-full rounded-xl bg-accent py-3 font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit bid"}
            </button>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="p-8 text-center">
            <CheckCircle className="mx-auto h-14 w-14 text-emerald-500" />
            <h2 className="mt-3 text-lg font-bold text-primary">Bid submitted</h2>
            <p className="mt-2 text-sm text-muted">We&apos;ll review and respond soon.</p>
            <Link
              href="/customer/bids"
              className="mt-4 inline-block text-sm font-semibold text-accent hover:underline"
            >
              Track in My bids →
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-xl border border-slate-200 py-2 text-sm font-medium"
            >
              Close
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
