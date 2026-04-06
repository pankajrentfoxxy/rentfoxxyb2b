"use client";

import { RazorpayTestBanner } from "@/components/checkout/RazorpayTestBanner";
import { getPaymentOptionConfig, parsePaymentOption } from "@/constants/payment-options";
import { gstBreakdown } from "@/lib/gst";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useState } from "react";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

type Addr = { id: string; label: string; line1: string; city: string; state: string; pincode: string };

export function BidPaymentClient({
  bidId,
  grossTotal,
  addresses,
  paymentOption,
}: {
  bidId: string;
  grossTotal: number;
  addresses: Addr[];
  paymentOption?: string | null;
}) {
  const router = useRouter();
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const po = parsePaymentOption(paymentOption);
  const cfg = getPaymentOptionConfig(po);
  const gst = gstBreakdown(grossTotal);
  const tokenFlow = po !== "FULL";

  async function pay() {
    if (!addressId) {
      alert("Select a delivery address in Profile first.");
      return;
    }
    setBusy(true);
    setPayError(null);
    try {
      const cr = await fetch("/api/customer/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bidId, addressId }),
      });
      const created = await cr.json();
      if (!cr.ok) {
        setPayError(
          created.error ??
            (cr.status === 503
              ? "Configure Razorpay (see .env.example) or enable PAYMENT_DEV_BYPASS=true for local-only simulation."
              : "Could not start payment"),
        );
        return;
      }

      if (created.devMode) {
        const vr = await fetch("/api/customer/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: created.orderId, devBypass: true }),
        });
        const v = await vr.json();
        if (!vr.ok) {
          alert(v.error ?? "Verify failed");
          return;
        }
        if (v.nextStep === "BALANCE_PAYMENT" && v.orderId) {
          router.push(`/customer/orders/${v.orderId}`);
        } else {
          router.push(`/customer/orders/${v.orderId}`);
        }
        router.refresh();
        return;
      }

      const key = created.key;
      if (!window.Razorpay || !key) {
        alert("Razorpay could not load");
        return;
      }

      const pay = new window.Razorpay({
        key,
        amount: created.amountPaise,
        currency: created.currency ?? "INR",
        order_id: created.razorpayOrderId,
        name: "Rentfoxxy",
        description: tokenFlow ? `Token payment — ${created.orderNumber}` : `Bid checkout ${created.orderNumber}`,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const vr = await fetch("/api/customer/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: created.orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const v = await vr.json();
          if (!vr.ok) {
            alert(v.error ?? "Verification failed");
            return;
          }
          router.push(`/customer/orders/${v.orderId}`);
          router.refresh();
        },
      });
      pay.open();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <RazorpayTestBanner />
      <div className="rounded-xl border border-slate-200 bg-surface p-4">
        <label className="block text-sm font-medium text-slate-800">Ship to</label>
        <select
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={addressId}
          onChange={(e) => setAddressId(e.target.value)}
        >
          {addresses.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label} — {a.city}, {a.state}
            </option>
          ))}
        </select>
        <p className="mt-3 text-sm text-muted">
          Order total (incl. GST):{" "}
          <strong className="text-slate-900">₹{gst.total.toLocaleString("en-IN")}</strong>
        </p>
        {tokenFlow ? (
          <p className="mt-2 text-sm text-amber-900">
            You are paying a <strong>{cfg.tokenPct}%</strong> token now (≈ ₹
            {Math.round(gst.total * (cfg.tokenPct / 100) * 100) / 100}).
            Balance is due within <strong>{cfg.windowHours}h</strong> of the token payment.
          </p>
        ) : null}
        {payError ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
            {payError}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-muted">
          Opens Razorpay Checkout when keys are set. Use your dashboard test mode and Razorpay&apos;s test payment
          methods.
        </p>
        <button
          type="button"
          disabled={busy || !addressId}
          onClick={pay}
          className="mt-4 w-full rounded-lg bg-amber-600 py-3 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {busy
            ? "Processing…"
            : tokenFlow
              ? `Pay token (${cfg.tokenPct}%)`
              : "Proceed to payment"}
        </button>
      </div>
    </>
  );
}
