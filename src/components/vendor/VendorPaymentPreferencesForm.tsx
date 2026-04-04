"use client";

import {
  DEFAULT_VENDOR_PAYMENT_METHODS,
  MIN_TOKEN_PERCENT_OPTIONS,
  PAYMENT_METHOD_CONFIG,
  PAYMENT_METHOD_IDS,
  type PaymentMethodId,
} from "@/constants/payment-methods";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

type VendorExtras = {
  acceptedPaymentMethods: string[];
  requiresFullAdvance: boolean;
  minOrderForRTGS: number | null;
  minTokenPercentage: number;
  acceptsTokenPayment: boolean;
};

export function VendorPaymentPreferencesForm() {
  const [data, setData] = useState<VendorExtras | null>(null);
  const [methods, setMethods] = useState<Set<string>>(new Set(DEFAULT_VENDOR_PAYMENT_METHODS));
  const [fullAdvance, setFullAdvance] = useState(false);
  const [rtgsAbove, setRtgsAbove] = useState("");
  const [minTok, setMinTok] = useState<number>(2);
  const [acceptsToken, setAcceptsToken] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/vendor/profile");
    if (!res.ok) return;
    const p = (await res.json()) as { vendor: VendorExtras };
    const v = p.vendor;
    setData(v);
    setMethods(new Set(v.acceptedPaymentMethods.length ? v.acceptedPaymentMethods : DEFAULT_VENDOR_PAYMENT_METHODS));
    setFullAdvance(v.requiresFullAdvance);
    setRtgsAbove(v.minOrderForRTGS != null ? String(v.minOrderForRTGS) : "");
    setMinTok(v.minTokenPercentage);
    setAcceptsToken(v.acceptsTokenPayment);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggleMethod(id: PaymentMethodId) {
    setMethods((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size <= 1) return next;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function savePrefs(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const rtgsNum = rtgsAbove.trim() === "" ? null : Number(rtgsAbove);
      const res = await fetch("/api/vendor/profile/payment-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acceptedPaymentMethods: Array.from(methods),
          requiresFullAdvance: fullAdvance,
          minOrderForRTGS: rtgsNum,
          minTokenPercentage: fullAdvance ? 100 : minTok,
          acceptsTokenPayment: fullAdvance ? false : acceptsToken,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setNotice({ type: "err", text: j.error ?? "Save failed" });
        return;
      }
      setNotice({ type: "ok", text: "Payment preferences saved." });
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (!data) {
    return <p className="text-sm text-muted">Loading payment preferences…</p>;
  }

  const tokenSection = !fullAdvance;

  return (
    <form onSubmit={savePrefs} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Payment preferences</h2>
        <p className="mt-1 text-sm text-muted">
          Buyers see a combined view on the product page (no supplier names). These rules also apply to bid
          checkout.
        </p>
      </div>

      {notice ? (
        <p
          className={notice.type === "ok" ? "text-sm text-emerald-700" : "text-sm text-red-800"}
          role={notice.type === "err" ? "alert" : undefined}
        >
          {notice.text}
        </p>
      ) : null}

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Accepted methods</h3>
        <p className="mt-1 text-xs text-muted">Select at least one. Enable NEFT/RTGS if you require wire for large orders.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {PAYMENT_METHOD_IDS.map((id) => {
            const cfg = PAYMENT_METHOD_CONFIG[id];
            const Icon = cfg.icon;
            const on = methods.has(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleMethod(id)}
                className={cn(
                  "flex gap-3 rounded-xl border p-3 text-left text-sm transition",
                  on ? "border-teal-600 bg-teal-50/60" : "border-slate-200 hover:bg-surface",
                )}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-700" />
                <span>
                  <span className="font-medium text-slate-900">{cfg.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{cfg.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={fullAdvance}
            onChange={(e) => setFullAdvance(e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="font-medium text-slate-900">Require full advance on every order</span>
            <span className="mt-0.5 block text-xs text-muted">
              Buyers cannot choose token + balance for your listings.
            </span>
          </span>
        </label>

        <div>
          <label className="text-sm font-medium text-slate-800">Require NEFT/RTGS above (₹)</label>
          <input
            type="number"
            min={0}
            className="mt-1 w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Leave blank if not required"
            value={rtgsAbove}
            onChange={(e) => setRtgsAbove(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted">Enable the NEFT/RTGS method above when you use this threshold.</p>
        </div>
      </div>

      {tokenSection ? (
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={acceptsToken}
              onChange={(e) => setAcceptsToken(e.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="font-medium text-slate-900">Accept token payment on bids</span>
              <span className="mt-0.5 block text-xs text-muted">
                Lets buyers lock stock with a small advance when Rentfoxxy supports it.
              </span>
            </span>
          </label>

          <div>
            <label className="text-sm font-medium text-slate-800">Minimum token you will accept</label>
            <select
              className="mt-1 w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={minTok}
              disabled={!acceptsToken}
              onChange={(e) => setMinTok(Number(e.target.value))}
            >
              {MIN_TOKEN_PERCENT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n === 100 ? "Full payment only (no token)" : `${n}% minimum`}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save payment preferences"}
      </button>
    </form>
  );
}
