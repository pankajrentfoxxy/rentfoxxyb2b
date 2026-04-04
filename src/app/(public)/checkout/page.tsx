"use client";

import { gstBreakdown } from "@/lib/gst";
import { useCartStore } from "@/store/cart-store";
import type { Address } from "@prisma/client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { status } = useSession();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const sub = useCartStore((s) => s.subtotal());
  const gst = gstBreakdown(sub);

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<string>("");
  const [gstin, setGstin] = useState("");
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: "Office",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/auth/login?callbackUrl=${encodeURIComponent("/checkout")}`);
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/customer/addresses")
      .then((r) => r.json())
      .then((d) => {
        setAddresses(d.addresses ?? []);
        const def = d.addresses?.find((a: Address) => a.isDefault);
        if (def) setAddressId(def.id);
        else if (d.addresses?.[0]) setAddressId(d.addresses[0].id);
      });
  }, [status]);

  async function saveNewAddress() {
    const res = await fetch("/api/customer/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, isDefault: addresses.length === 0 }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Could not save address");
      return;
    }
    setAddresses((prev) => [...prev, data.address]);
    setAddressId(data.address.id);
    setStep(2);
  }

  async function pay() {
    if (!addressId || !items.length) return;
    setBusy(true);
    setPayError(null);
    try {
      const cr = await fetch("/api/customer/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId,
          items,
          customerGstin: gstin || undefined,
        }),
      });
      const created = await cr.json();
      if (!cr.ok) {
        const errText =
          created.error ??
          (cr.status === 503
            ? "Payments are not configured. Add Razorpay test keys to .env.local (see .env.example) or use PAYMENT_DEV_BYPASS=true locally."
            : "Payment init failed");
        setPayError(errText);
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
        clear();
        router.push(`/customer/orders/${v.orderId}`);
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
        description: `Order ${created.orderNumber}`,
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
          clear();
          router.push(`/customer/orders/${v.orderId}`);
        },
      });
      pay.open();
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") {
    return <div className="py-24 text-center text-muted">Loading…</div>;
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-slate-800">Your cart is empty.</p>
        <Link href="/products" className="mt-4 inline-block text-accent hover:underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
        <div className="mt-6 flex gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-2 flex-1 rounded-full ${step >= n ? "bg-accent" : "bg-slate-200"}`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Step {step} of 3 —{" "}
          {step === 1 ? "Address" : step === 2 ? "Review" : "Payment"}
        </p>

        {step === 1 && (
          <div className="mt-8 space-y-6">
            <div>
              <h2 className="font-semibold text-slate-900">Saved addresses</h2>
              <div className="mt-3 space-y-2">
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className="flex cursor-pointer gap-3 rounded-lg border p-3 has-[:checked]:border-accent"
                  >
                    <input
                      type="radio"
                      name="addr"
                      checked={addressId === a.id}
                      onChange={() => setAddressId(a.id)}
                    />
                    <div>
                      <p className="font-medium">{a.label}</p>
                      <p className="text-sm text-muted">
                        {a.line1}, {a.city}, {a.state} {a.pincode}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">Add new address</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded border px-3 py-2 text-sm"
                  placeholder="Label"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                />
                <input
                  className="rounded border px-3 py-2 text-sm sm:col-span-2"
                  placeholder="Address line 1"
                  value={form.line1}
                  onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
                />
                <input
                  className="rounded border px-3 py-2 text-sm sm:col-span-2"
                  placeholder="Address line 2 (optional)"
                  value={form.line2}
                  onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
                />
                <input
                  className="rounded border px-3 py-2 text-sm"
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
                <input
                  className="rounded border px-3 py-2 text-sm"
                  placeholder="State"
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                />
                <input
                  className="rounded border px-3 py-2 text-sm"
                  placeholder="Pincode"
                  value={form.pincode}
                  onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                />
              </div>
              <button
                type="button"
                onClick={saveNewAddress}
                className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-surface"
              >
                Save &amp; use this address
              </button>
            </div>

            <button
              type="button"
              disabled={!addressId}
              onClick={() => setStep(2)}
              className="w-full rounded-lg bg-primary py-3 font-semibold text-white disabled:opacity-50"
            >
              Continue to review
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-8 space-y-6">
            <h2 className="font-semibold text-slate-900">Order review</h2>
            <ul className="space-y-2 text-sm">
              {items.map((i) => (
                <li key={i.listingId} className="flex justify-between border-b py-2">
                  <span>
                    {i.productName} × {i.quantity}
                  </span>
                  <span>₹{(i.unitPrice * i.quantity).toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>₹{gst.subtotal.toLocaleString("en-IN")}</dd>
              </div>
              <div className="flex justify-between">
                <dt>CGST (9%)</dt>
                <dd>₹{gst.cgst.toLocaleString("en-IN")}</dd>
              </div>
              <div className="flex justify-between">
                <dt>SGST (9%)</dt>
                <dd>₹{gst.sgst.toLocaleString("en-IN")}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>Grand total</dt>
                <dd>₹{gst.total.toLocaleString("en-IN")}</dd>
              </div>
            </dl>
            <p className="text-sm text-muted">Estimated delivery: 5–7 business days</p>
            <label className="block text-sm">
              <span className="font-medium text-slate-800">Company GSTIN (optional)</span>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="For B2B tax invoice"
              />
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-lg border py-3 font-medium"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setPayError(null);
                  setStep(3);
                }}
                className="flex-1 rounded-lg bg-primary py-3 font-semibold text-white"
              >
                Continue to payment
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-8 space-y-4">
            <p className="text-slate-800">
              Pay <strong>₹{gst.total.toLocaleString("en-IN")}</strong> with Razorpay Checkout (test or live keys from
              your dashboard).
            </p>
            <p className="text-xs text-muted">
              With test keys, complete the modal using Razorpay&apos;s test UPI/card flow — the app only marks the
              order paid after verification succeeds (no instant success without going through Checkout unless{" "}
              <code className="rounded bg-slate-100 px-1">PAYMENT_DEV_BYPASS=true</code>).
            </p>
            {payError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
                {payError}
              </p>
            ) : null}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-lg border py-3">
                Back
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={pay}
                className="flex-1 rounded-lg bg-accent py-3 font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Processing…" : "Pay now"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
