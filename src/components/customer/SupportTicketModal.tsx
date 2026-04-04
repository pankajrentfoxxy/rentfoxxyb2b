"use client";

import { useState } from "react";

export function SupportTicketModal({
  orderId,
  orderNumber,
}: {
  orderId: string;
  orderNumber: string;
}) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/customer/support", {
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
      alert("Support ticket created. Our team will follow up by email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-surface"
      >
        Raise support ticket
      </button>
      {open ? (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Support — order {orderNumber}</h3>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Subject</label>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Short summary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Message</label>
                <textarea
                  required
                  rows={4}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  className="flex-1 rounded-lg border py-2 text-sm"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-white disabled:opacity-50"
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
