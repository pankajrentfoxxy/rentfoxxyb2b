"use client";

import { useEffect, useState } from "react";

type Settings = {
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  address: string;
  gstin: string;
  pan: string;
  defaultCommission: number;
  invoicePrefix: string;
  proformaPrefix: string;
  creditNotePrefix: string;
  companyState: string;
  orderPrefix: string;
  razorpayKeyId: string;
  razorpayKeySecretMasked: string;
  webhookPublicUrl: string;
};

export function AdminSettingsForm() {
  const [s, setS] = useState<Settings | null>(null);
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) return;
      const data = (await res.json()) as { settings: Settings };
      setS(data.settings);
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!s) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: s.companyName,
          companyPhone: s.companyPhone,
          companyEmail: s.companyEmail,
          address: s.address,
          gstin: s.gstin,
          pan: s.pan,
          defaultCommission: s.defaultCommission,
          invoicePrefix: s.invoicePrefix,
          proformaPrefix: s.proformaPrefix,
          creditNotePrefix: s.creditNotePrefix,
          companyState: s.companyState,
          orderPrefix: s.orderPrefix,
          razorpayKeyId: s.razorpayKeyId,
          webhookPublicUrl: s.webhookPublicUrl,
          ...(razorpayKeySecret.trim() ? { razorpayKeySecret: razorpayKeySecret.trim() } : {}),
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        alert(j.error ?? "Failed");
        return;
      }
      setMsg("Saved.");
      setRazorpayKeySecret("");
    } finally {
      setBusy(false);
    }
  }

  if (!s) return <p className="text-sm text-muted">Loading…</p>;

  const webhookDisplay =
    s.webhookPublicUrl ||
    (typeof window !== "undefined" && process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/razorpay`
      : "/api/webhooks/razorpay");

  return (
    <form onSubmit={save} className="mx-auto max-w-2xl space-y-5">
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Company</h2>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={s.companyName}
          onChange={(e) => setS({ ...s, companyName: e.target.value })}
          placeholder="Legal name"
        />
        <textarea
          className="w-full rounded-lg border px-3 py-2 text-sm"
          rows={3}
          value={s.address}
          onChange={(e) => setS({ ...s, address: e.target.value })}
          placeholder="Registered address"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-lg border px-3 py-2 font-mono text-sm"
            value={s.gstin}
            onChange={(e) => setS({ ...s, gstin: e.target.value })}
            placeholder="GSTIN"
          />
          <input
            className="rounded-lg border px-3 py-2 font-mono text-sm"
            value={s.pan}
            onChange={(e) => setS({ ...s, pan: e.target.value })}
            placeholder="PAN"
          />
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            value={s.companyPhone}
            onChange={(e) => setS({ ...s, companyPhone: e.target.value })}
            placeholder="Phone"
          />
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            type="email"
            value={s.companyEmail}
            onChange={(e) => setS({ ...s, companyEmail: e.target.value })}
            placeholder="Email"
          />
        </div>
        <label className="text-sm">
          Default commission % (new vendors)
          <input
            type="number"
            className="mt-1 w-32 rounded-lg border px-3 py-2 text-sm"
            value={s.defaultCommission}
            onChange={(e) => setS({ ...s, defaultCommission: Number(e.target.value) })}
          />
        </label>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Invoice / GST</h2>
        <p className="text-xs text-muted">Company state vs shipping state decides CGST+SGST vs IGST on PDFs.</p>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={s.companyState}
          onChange={(e) => setS({ ...s, companyState: e.target.value })}
          placeholder="Company state (e.g. Karnataka)"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-muted">
            Tax invoice prefix
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm"
              value={s.invoicePrefix}
              onChange={(e) => setS({ ...s, invoicePrefix: e.target.value })}
            />
          </label>
          <label className="text-xs text-muted">
            Proforma prefix
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm"
              value={s.proformaPrefix}
              onChange={(e) => setS({ ...s, proformaPrefix: e.target.value })}
            />
          </label>
          <label className="text-xs text-muted">
            Credit note prefix
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm"
              value={s.creditNotePrefix}
              onChange={(e) => setS({ ...s, creditNotePrefix: e.target.value })}
            />
          </label>
          <label className="text-xs text-muted">
            Order prefix
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm"
              value={s.orderPrefix}
              onChange={(e) => setS({ ...s, orderPrefix: e.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Payment</h2>
        <input
          className="w-full rounded-lg border px-3 py-2 font-mono text-sm"
          value={s.razorpayKeyId}
          onChange={(e) => setS({ ...s, razorpayKeyId: e.target.value })}
          placeholder="Razorpay Key ID"
        />
        <div>
          <p className="text-xs text-muted">Secret (leave blank to keep). Stored: {s.razorpayKeySecretMasked}</p>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm"
            value={razorpayKeySecret}
            onChange={(e) => setRazorpayKeySecret(e.target.value)}
            placeholder="New secret"
          />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-700">Webhook URL (configure in Razorpay)</p>
          <code className="mt-1 block rounded bg-surface px-2 py-1 text-xs">{webhookDisplay}</code>
          <input
            className="mt-2 w-full rounded-lg border px-3 py-2 text-xs"
            value={s.webhookPublicUrl}
            onChange={(e) => setS({ ...s, webhookPublicUrl: e.target.value })}
            placeholder="Optional public base URL note"
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
