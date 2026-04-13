"use client";

import { RazorpayTestBanner } from "@/components/checkout/RazorpayTestBanner";
import { getPaymentOptionConfig, type PaymentOptionId } from "@/constants/payment-options";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Script from "next/script";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

type Address = {
  id: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
};

export function PaymentFlowModal({
  purchaseType,
  listingId,
  title,
  quantity,
  lotSize,
  subtotalExGst,
  gstAmount,
  grandTotal,
  payOption,
  payNowAmount,
  balanceLater,
  onClose,
}: {
  purchaseType: "LOT" | "ASAS";
  listingId: string;
  title: string;
  quantity: number;
  lotSize?: number;
  subtotalExGst: number;
  gstAmount: number;
  grandTotal: number;
  payOption: PaymentOptionId;
  payNowAmount: number;
  balanceLater: number;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState("");
  const [gstin, setGstin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [nextStep, setNextStep] = useState<string | null>(null);
  const [balanceDueAt, setBalanceDueAt] = useState<string | null>(null);
  const [balanceAmount, setBalanceAmount] = useState<number | null>(null);

  useEffect(() => {
    void fetch("/api/customer/addresses")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.addresses ?? []) as Address[];
        setAddresses(list);
        if (list[0]) setAddressId(list[0].id);
      });
  }, []);

  useEffect(() => {
    if (step === 3) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#2563EB", "#0F2D5E", "#F59E0B"],
      });
    }
  }, [step]);

  async function startCheckout() {
    if (!addressId) {
      setErr("Select a delivery address");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const url =
        purchaseType === "LOT" ? "/api/customer/lot-purchases" : "/api/customer/asas-purchases";
      const body =
        purchaseType === "LOT"
          ? {
              lotId: listingId,
              lotsCount: quantity,
              checkout: true,
              addressId,
              paymentOption: payOption,
              customerGstin: gstin.trim() || undefined,
            }
          : {
              asasId: listingId,
              quantity,
              checkout: true,
              addressId,
              paymentOption: payOption,
              customerGstin: gstin.trim() || undefined,
            };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Checkout failed");
        return;
      }

      const pid = data.purchaseId as string;
      setPurchaseId(pid);
      setReference((data.purchaseReference as string) ?? null);

      if (data.devMode) {
        const vr = await fetch("/api/customer/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            purchaseType,
            lotPurchaseId: purchaseType === "LOT" ? pid : undefined,
            asasPurchaseId: purchaseType === "ASAS" ? pid : undefined,
            devBypass: true,
          }),
        });
        const v = await vr.json();
        if (!vr.ok) {
          setErr(v.error ?? "Verify failed");
          return;
        }
        setNextStep(v.nextStep ?? null);
        setBalanceDueAt(v.balanceDueAt ?? null);
        setBalanceAmount(v.balanceAmount ?? null);
        setStep(3);
        return;
      }

      const key = data.key as string | undefined;
      if (!window.Razorpay || !key) {
        setErr("Razorpay could not load");
        return;
      }

      const rzp = new window.Razorpay({
        key,
        amount: Math.round(Number(data.amount) * 100),
        currency: "INR",
        order_id: data.razorpayOrderId,
        name: "Rentfoxxy",
        description: `${title} — ${quantity} ${purchaseType === "LOT" ? "lot(s)" : "units"}`,
        prefill: {
          email: session?.user?.email ?? "",
        },
        theme: { color: "#2563EB" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const vr = await fetch("/api/customer/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              purchaseType,
              lotPurchaseId: purchaseType === "LOT" ? pid : undefined,
              asasPurchaseId: purchaseType === "ASAS" ? pid : undefined,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const v = await vr.json();
          if (!vr.ok) {
            alert(v.error ?? "Payment verify failed");
            return;
          }
          setNextStep(v.nextStep ?? null);
          setBalanceDueAt(v.balanceDueAt ?? null);
          setBalanceAmount(v.balanceAmount ?? null);
          setStep(3);
        },
      });
      rzp.open();
    } finally {
      setBusy(false);
    }
  }

  const cfg = getPaymentOptionConfig(payOption);

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
          {step === 1 ? (
            <div className="space-y-4 p-5">
              <div className="flex justify-between gap-2">
                <h2 className="text-lg font-bold">Review order</h2>
                <button type="button" onClick={onClose} className="text-sm text-muted">
                  Close
                </button>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 text-sm">
                <p className="font-medium text-primary">{title}</p>
                <p className="mt-2 text-muted">
                  {purchaseType === "LOT"
                    ? `${quantity} lot(s) · ${quantity * (lotSize ?? 0)} units`
                    : `${quantity} units`}
                </p>
                <dl className="mt-3 space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-muted">Subtotal (ex-GST)</dt>
                    <dd>₹{subtotalExGst.toLocaleString("en-IN")}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">GST 18%</dt>
                    <dd>₹{gstAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</dd>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <dt>Grand total</dt>
                    <dd>₹{grandTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</dd>
                  </div>
                </dl>
              </div>
              {payOption !== "FULL" ? (
                <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-semibold">
                    Pay {cfg.tokenPct}% now (₹{payNowAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}) — balance{" "}
                    {100 - cfg.tokenPct}% (₹{balanceLater.toLocaleString("en-IN", { maximumFractionDigits: 0 })}) due within{" "}
                    {cfg.windowLabel ?? `${cfg.windowHours}h`} of token payment.
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    Seven-day window (168h) from token confirmation — same terms across lots, As-Is, and product bids.
                  </p>
                </div>
              ) : null}
              <div>
                <label className="text-sm font-medium">Delivery address</label>
                <div className="mt-2 space-y-2">
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      className={`flex cursor-pointer gap-2 rounded-lg border p-3 text-sm ${
                        addressId === a.id ? "border-accent bg-accent/5" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="addr"
                        checked={addressId === a.id}
                        onChange={() => setAddressId(a.id)}
                      />
                      <span>
                        {a.label} — {a.line1}, {a.city}
                      </span>
                    </label>
                  ))}
                </div>
                <Link href="/customer/profile" className="mt-2 inline-block text-xs text-accent">
                  Manage addresses
                </Link>
              </div>
              <div>
                <label className="text-sm font-medium">GSTIN (optional)</label>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                />
              </div>
              {err ? <p className="text-sm text-red-600">{err}</p> : null}
              <button
                type="button"
                onClick={() => {
                  setErr(null);
                  setStep(2);
                }}
                className="w-full rounded-xl bg-primary py-3 font-semibold text-white"
              >
                Proceed to payment
              </button>
            </div>
          ) : null}
          {step === 2 ? (
            <div className="space-y-4 p-5">
              <RazorpayTestBanner />
              <h2 className="font-bold">Secure payment</h2>
              <p className="text-sm text-muted">
                You will pay ₹{payNowAmount.toLocaleString("en-IN")} now.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void startCheckout()}
                className="w-full rounded-xl bg-accent py-3 font-bold text-white disabled:opacity-50"
              >
                {busy ? "Starting…" : `Pay ₹${payNowAmount.toLocaleString("en-IN")}`}
              </button>
              <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-muted">
                Back
              </button>
            </div>
          ) : null}
          {step === 3 ? (
            <div className="space-y-3 p-8 text-center">
              <p className="text-xl font-bold text-emerald-700">Payment received</p>
              {reference ? <p className="text-sm text-muted">Ref: {reference}</p> : null}
              {nextStep === "BALANCE_PAYMENT" && balanceAmount != null ? (
                <p className="text-sm text-amber-800">
                  Balance ₹{balanceAmount.toLocaleString("en-IN")}
                  {balanceDueAt ? ` due by ${new Date(balanceDueAt).toLocaleString("en-IN")}` : ""}
                </p>
              ) : (
                <p className="text-sm text-muted">Thank you — we&apos;ll keep you updated on dispatch.</p>
              )}
              <Link
                href={
                  purchaseType === "LOT" && purchaseId
                    ? `/customer/lot-purchases/${purchaseId}`
                    : purchaseId
                      ? `/customer/asas-purchases/${purchaseId}`
                      : "/customer/dashboard"
                }
                className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                View purchase
              </Link>
              <button type="button" onClick={onClose} className="block w-full text-sm text-muted">
                Close
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
