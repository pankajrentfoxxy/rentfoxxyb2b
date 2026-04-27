"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  brand: string;
  targetPrice: number;
  currentMinPrice: number | null;
  reached: boolean;
};

export default function CustomerWatchlistPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/customer/watchlist");
    if (!res.ok) {
      setRows([]);
      return;
    }
    const j = (await res.json()) as { watches?: Row[] };
    setRows(j.watches ?? []);
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  async function remove(id: string) {
    await fetch(`/api/customer/watchlist/${id}`, { method: "DELETE" });
    await load();
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-[22px] font-medium text-ink-primary">Price watch</h1>
        <p className="mt-1 text-[12px] text-ink-muted">
          We notify you when the lowest active storefront price hits your target.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-border bg-white p-8 text-center text-sm text-muted">
          No active watches. Open a product and set a target price.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((w) => (
            <li
              key={w.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4"
            >
              <div>
                <Link href={`/products/${w.slug}`} className="font-medium text-lot hover:underline">
                  {w.name}
                </Link>
                <p className="text-[11px] text-ink-muted">{w.brand}</p>
                <p className="mt-2 text-[12px] text-ink-secondary">
                  Target ₹{w.targetPrice.toLocaleString("en-IN")}
                  {w.currentMinPrice != null ? (
                    <>
                      {" "}
                      · Current from ₹{w.currentMinPrice.toLocaleString("en-IN")}
                    </>
                  ) : null}
                </p>
                {w.reached ? (
                  <span className="mt-2 inline-block rounded-full bg-verified-bg px-2 py-0.5 text-[10px] font-semibold text-verified-text">
                    At or below target
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void remove(w.id)}
                className="text-[12px] text-red-600 hover:underline"
              >
                Stop watching
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
