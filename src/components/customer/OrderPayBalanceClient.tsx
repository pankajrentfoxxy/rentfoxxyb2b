"use client";

import { roundMoney } from "@/constants/payment-options";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

export function OrderPayBalanceClient({
  orderId,
  orderNumber,
  balanceDueAtIso,
  balanceAmount,
  tokenAmount,
}: {
  orderId: string;
  orderNumber: string;
  balanceDueAtIso: string;
  balanceAmount: number;
  tokenAmount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((c) => c + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const due = new Date(balanceDueAtIso);
  const msLeft = due.getTime() - Date.now();
  const hoursLeft = Math.max(0, Math.floor(msLeft / 3600000));
  const minsLeft = Math.max(0, Math.floor((msLeft % 3600000) / 60000));
  void tick;

  async function pay() {
    setBusy(true);
    setPayError(null);
    try {
      const cr = await fetch(`/api/customer/orders/${orderId}/pay-balance`, { method: "POST" });
      const created = await cr.json();
      if (!cr.ok) {
        setPayError(
          created.error ??
            (cr.status === 503
              ? "Configure Razorpay or use PAYMENT_DEV_BYPASS=true locally."
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
        router.push(`/customer/orders/${v.orderId}`);
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
        description: `Balance — ${orderNumber}`,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const vr = await fetch("/api/customer/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
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

  const bal = roundMoney(balanceAmount);

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-4 text-amber-950 shadow-sm">
        <p className="text-sm font-semibold">Stock reserved — balance due</p>
        <p className="mt-2 text-sm">
          Pay <strong>₹{bal.toLocaleString("en-IN")}</strong> by{" "}
          {due.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
        </p>
        <p className="mt-1 text-xs">
          Time left: ~{hoursLeft}h {minsLeft}m · Token paid ₹{tokenAmount.toLocaleString("en-IN")} is
          non-refundable if you miss the deadline.
        </p>
        {payError ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-800/10 px-3 py-2 text-sm text-red-950" role="alert">
            {payError}
          </p>
        ) : null}
        <button
          type="button"
          disabled={busy || msLeft <= 0}
          onClick={pay}
          className="mt-4 w-full rounded-lg bg-amber-700 py-3 font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
        >
          {busy ? "Processing…" : "Pay balance now"}
        </button>
      </div>
    </>
  );
}
