"use client";

import { useState } from "react";

export function VendorOrderFulfilment({
  orderId,
  orderNumber,
  status,
  canUpdate,
  multiVendor,
}: {
  orderId: string;
  orderNumber: string;
  status: string;
  canUpdate: boolean;
  multiVendor: boolean;
}) {
  const [carrier, setCarrier] = useState("");
  const [awb, setAwb] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function post(action: string, extra?: Record<string, string>) {
    setBusy(action);
    setMsg(null);
    try {
      const res = await fetch(`/api/vendor/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Update failed");
        return;
      }
      window.location.reload();
    } finally {
      setBusy(null);
    }
  }

  if (multiVendor) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
        This order includes items from multiple vendors. Fulfilment status cannot be changed from the
        vendor portal — contact support if you need a split shipment.
      </div>
    );
  }

  if (!canUpdate) {
    return (
      <p className="text-sm text-muted">
        This order is not in a state you can advance from here ({status.replace(/_/g, " ")}).
      </p>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Update fulfilment</h2>
      {msg ? <p className="text-sm text-rose-600">{msg}</p> : null}

      {["ORDER_PLACED", "ORDER_CONFIRMED"].includes(status) ? (
        <button
          type="button"
          disabled={!!busy}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          onClick={() => post("mark_packed")}
        >
          {busy === "mark_packed" ? "Updating…" : "Mark packed"}
        </button>
      ) : null}

      {status === "PACKED" ? (
        <div className="space-y-2">
          <p className="text-xs text-muted">Add carrier details, then mark dispatched.</p>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Carrier (e.g. Blue Dart)"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="AWB / tracking number"
            value={awb}
            onChange={(e) => setAwb(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Tracking URL (optional)"
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
          />
          <button
            type="button"
            disabled={!!busy}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            onClick={() =>
              post("mark_dispatched", { carrier, awbNumber: awb, trackingUrl: trackingUrl || "" })
            }
          >
            {busy === "mark_dispatched" ? "Updating…" : "Mark dispatched"}
          </button>
        </div>
      ) : null}

      {["DISPATCHED", "OUT_FOR_DELIVERY"].includes(status) ? (
        <button
          type="button"
          disabled={!!busy}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50"
          onClick={() => post("mark_delivered")}
        >
          {busy === "mark_delivered" ? "Updating…" : "Confirm delivered"}
        </button>
      ) : null}

      <VendorOrderSupportButton orderId={orderId} orderNumber={orderNumber} />
    </div>
  );
}

function VendorOrderSupportButton({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/vendor/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim() || `Order ${orderNumber}`,
          orderId,
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed");
        return;
      }
      setOpen(false);
      setSubject("");
      setMessage("");
      alert("Support ticket created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-accent hover:underline"
      >
        Raise support ticket for this order
      </button>
      {open ? (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Support — {orderNumber}</h3>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <textarea
                required
                rows={4}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
