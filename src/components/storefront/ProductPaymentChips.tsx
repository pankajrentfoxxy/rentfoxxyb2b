"use client";

import { PAYMENT_METHOD_CONFIG, type PaymentMethodId } from "@/constants/payment-methods";
import { useEffect, useState } from "react";

export function ProductPaymentChips({ slug }: { slug: string }) {
  const [methods, setMethods] = useState<PaymentMethodId[]>([]);
  const [token, setToken] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/public/products/${encodeURIComponent(slug)}/payment-methods`);
        const data = await res.json();
        if (!res.ok || cancelled) return;
        setMethods(data.availableMethods ?? []);
        setToken(!!data.tokenAvailable);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (methods.length === 0 && !token) {
    return null;
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <h3 className="text-sm font-semibold text-slate-900">Payment options (this product)</h3>
      <p className="mt-1 text-xs text-muted">
        Combined from active listings — supplier identities are not shown.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {methods.map((id) => {
          const cfg = PAYMENT_METHOD_CONFIG[id];
          if (!cfg) return null;
          const Icon = cfg.icon;
          return (
            <span
              key={id}
              title={cfg.description}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-surface px-3 py-1 text-xs font-medium text-slate-800"
            >
              <Icon className="h-3.5 w-3.5" />
              {cfg.label}
            </span>
          );
        })}
        {token ? (
          <span
            title="Some options may allow a small token now and balance later on approved bids"
            className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-950"
          >
            Token + balance (bids)
          </span>
        ) : null}
      </div>
    </div>
  );
}
