"use client";

import { PAYMENT_OPTIONS } from "@/constants/payment-options";
import { CheckCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function AsAsBidModal({
  listing,
  quantity: initialQty,
  onClose,
}: {
  listing: any;
  quantity: number;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [quantity, setQuantity] = useState(initialQty);
  const [bidPricePerUnit, setBidPricePerUnit] = useState(Math.round(listing.avgUnitPrice * 0.92));
  const [note, setNote] = useState("");
  const [payOption, setPayOption] = useState("FULL");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const floor = listing.avgUnitPrice * 0.5;
  const totalBid = quantity * bidPricePerUnit;
  const listTotal = quantity * listing.avgUnitPrice;
  const savings = listTotal - totalBid;

  async function submit() {
    if (session?.user?.role !== "CUSTOMER") {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/asas/listings/${listing.id}`)}`);
      return;
    }
    if (bidPricePerUnit < floor) {
      setErr(`Minimum offer is ₹${Math.ceil(floor).toLocaleString("en-IN")} per unit`);
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch("/api/customer/asas-bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asasId: listing.id,
          quantity,
          bidPricePerUnit,
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
            <h2 className="text-lg font-bold text-primary">Negotiate AsAs pricing</h2>
            <p className="text-sm text-muted">Bid per unit for the quantity you need.</p>
            <div>
              <label className="text-sm font-medium">Units</label>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="text-xl font-bold">{quantity}</span>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border"
                  onClick={() => setQuantity((q) => Math.min(listing.unitsAvailable, q + 1))}
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Price per unit (₹)</label>
              <input
                type="number"
                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                value={bidPricePerUnit}
                onChange={(e) => setBidPricePerUnit(Number(e.target.value) || 0)}
              />
              <p className="mt-1 text-xs text-muted">
                Total ₹{totalBid.toLocaleString("en-IN")} · Save ₹
                {Math.max(0, savings).toLocaleString("en-IN")}
              </p>
            </div>
            <textarea
              className="w-full rounded-lg border px-3 py-2 text-sm"
              rows={2}
              maxLength={300}
              placeholder="Optional note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {err ? <p className="text-sm text-red-600">{err}</p> : null}
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full rounded-xl bg-primary py-3 font-semibold text-white"
            >
              Next
            </button>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="space-y-4 p-5">
            <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-accent">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <h2 className="font-bold">Payment preference</h2>
            <div className="space-y-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border-2 p-3 ${
                    payOption === opt.id ? "border-accent bg-accent/5" : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    checked={payOption === opt.id}
                    onChange={() => setPayOption(opt.id)}
                  />
                  <span className="text-sm font-medium">{opt.label}</span>
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
            <p className="mt-3 font-bold">Bid submitted</p>
            <Link href="/customer/bids" className="mt-4 inline-block text-sm text-accent hover:underline">
              View bids →
            </Link>
            <button type="button" onClick={onClose} className="mt-6 w-full rounded-lg border py-2 text-sm">
              Close
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
