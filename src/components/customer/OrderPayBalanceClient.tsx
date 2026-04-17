"use client";

import { RazorpayTestBanner } from "@/components/checkout/RazorpayTestBanner";
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
    const t = setInterval(() => setTick((c) => c + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const due = new Date(balanceDueAtIso);
  const msLeft = due.getTime() - Date.now();
  void tick;

  const totalSecs = Math.max(0, Math.floor(msLeft / 1000));
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

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
      <RazorpayTestBanner />
      <div className="rounded-xl bg-gradient-to-r from-amber to-amber-dark p-5 text-navy shadow-sm">
        <p className="text-[15px] font-semibold">⏰ Balance due before dispatch</p>
        <p className="mt-2 text-[13px]">
          Pay <strong>₹{bal.toLocaleString("en-IN")}</strong> by{" "}
          {due.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
        </p>
        <p className="mt-1 text-[12px] text-navy/70">
          Deadline above — token ₹{tokenAmount.toLocaleString("en-IN")} is non-refundable if missed.
        </p>
        <p className="mt-3 font-mono text-[18px] font-bold tabular-nums">
          {msLeft <= 0
            ? "Deadline passed"
            : `${days}d ${hours}h ${mins}m ${secs}s`}
        </p>
        {payError ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-white/90 px-3 py-2 text-sm text-red-900" role="alert">
            {payError}
          </p>
        ) : null}
        <button
          type="button"
          disabled={busy || msLeft <= 0}
          onClick={pay}
          className="mt-4 w-full rounded-xl bg-white py-3 text-[15px] font-bold text-amber-dark shadow-sm hover:bg-amber-bg disabled:opacity-50"
        >
          {busy ? "Processing…" : "Pay Balance Now"}
        </button>
        <p className="mt-2 text-[10px] text-navy/50">
          Missing the deadline may forfeit your token per policy.
        </p>
      </div>
    </>
  );
}
