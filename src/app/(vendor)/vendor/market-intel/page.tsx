"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type MarketRow = {
  listingId: string;
  productName: string;
  myPrice: number;
  marketMin: number | null;
  marketMax: number | null;
  marketAvg: number | null;
  competitorCount: number;
  priceDiffPct: number;
};

type WatchRow = { listingId: string; watchCount: number };

type BidGap = {
  listingId: string;
  avgBidPrice: number | null;
  minBidPrice: number;
  gap: number | null;
};

type StockAge = { listingId: string; daysListed: number; totalSales: number };

type DemandSignal = { productId: string; name: string; watchers: number };

function diffClass(pct: number): string {
  if (pct > 15) return "text-red-600";
  if (pct > 5) return "text-amber-700";
  return "text-emerald-700";
}

function recoChip(pct: number): { label: string; cls: string } {
  if (pct > 15) return { label: "Consider reducing price", cls: "bg-red-100 text-red-800" };
  if (pct > 5) return { label: "Slightly above market", cls: "bg-amber-100 text-amber-900" };
  return { label: "Competitive", cls: "bg-emerald-100 text-emerald-900" };
}

export default function VendorMarketIntelPage() {
  const [data, setData] = useState<{
    marketPrices: MarketRow[];
    watchCount: WatchRow[];
    bidGaps: BidGap[];
    stockAge: StockAge[];
    demandSignals: DemandSignal[];
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/vendor/market-intel")
      .then(async (r) => {
        if (!r.ok) {
          setErr("Could not load");
          return;
        }
        setData(await r.json());
      })
      .catch(() => setErr("Could not load"));
  }, []);

  const watchMap = useMemo(() => new Map((data?.watchCount ?? []).map((w) => [w.listingId, w.watchCount])), [data]);

  if (err || !data) {
    return <p className="text-sm text-muted">{err ?? "Loading…"}</p>;
  }

  const stale = data.stockAge.filter((s) => s.daysListed > 30 && s.totalSales === 0);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Market intelligence</h1>
        <p className="mt-1 text-sm text-muted">Real-time insights to help you price better and sell faster.</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
          Your listings vs market
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-muted">
              <tr>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Your price</th>
                <th className="px-4 py-2">Market avg</th>
                <th className="px-4 py-2">Difference</th>
                <th className="px-4 py-2">Watchers</th>
                <th className="px-4 py-2">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.marketPrices.map((m) => {
                const w = watchMap.get(m.listingId) ?? 0;
                const pct = m.priceDiffPct;
                const chip = recoChip(pct);
                return (
                  <tr key={m.listingId}>
                    <td className="px-4 py-2 font-medium text-slate-900">{m.productName}</td>
                    <td className="px-4 py-2">₹{m.myPrice.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2">
                      {m.marketAvg != null ? `₹${Math.round(m.marketAvg).toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className={`px-4 py-2 font-medium ${diffClass(pct)}`}>
                      {m.marketAvg == null
                        ? "—"
                        : pct === 0
                          ? "At market avg"
                          : pct > 0
                            ? `+${pct}% above avg`
                            : `${pct}% below avg`}
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-1">
                        <Bell className="h-3.5 w-3.5" />
                        {w} {w === 1 ? "buyer" : "buyers"}
                        {w > 5 ? (
                          <span className="rounded bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-900">
                            High demand
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${chip.cls}`}>
                        {chip.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Bid gap analysis</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.bidGaps
            .filter((b) => b.avgBidPrice != null)
            .map((b) => (
              <div key={b.listingId} className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
                <p>
                  Customers bid avg{" "}
                  <strong>₹{b.avgBidPrice!.toLocaleString("en-IN")}</strong> / unit.
                </p>
                <p className="mt-1 text-muted">
                  Your minimum bid: ₹{b.minBidPrice.toLocaleString("en-IN")}
                </p>
                {b.gap != null && b.gap > 3000 ? (
                  <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-950">
                    Consider lowering minimum bid by ~₹{Math.round(b.gap / 2).toLocaleString("en-IN")} to convert
                    more requests.
                  </p>
                ) : null}
              </div>
            ))}
        </div>
      </section>

      {stale.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold text-slate-900">Stock age alerts</h2>
          <ul className="mt-2 space-y-2">
            {stale.map((s) => (
              <li
                key={s.listingId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm"
              >
                <span className="text-red-900">
                  Listed {s.daysListed} days · No sales — consider a 10–15% price test.
                </span>
                <Link href="/vendor/products" className="text-accent hover:underline">
                  Edit listing
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.demandSignals.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold text-slate-900">Demand signals</h2>
          <p className="mt-1 text-xs text-muted">Watched products you don&apos;t list yet.</p>
          <ul className="mt-3 space-y-2">
            {data.demandSignals.map((d) => (
              <li
                key={d.productId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm"
              >
                <span>
                  <strong>{d.name}</strong> — {d.watchers} active watches
                </span>
                <Link href="/vendor/products" className="text-accent hover:underline">
                  Add to catalog
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
