"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CommonTable, type Column } from "@/components/commonStyle/CommonTable";

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

type MarketTableRow = MarketRow & { watchCount: number };

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
  const [searchQuery, setSearchQuery] = useState("");

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

  const tableRows: MarketTableRow[] = useMemo(() => {
    if (!data) return [];
    const wm = new Map(data.watchCount.map((w) => [w.listingId, w.watchCount]));
    return data.marketPrices.map((m) => ({ ...m, watchCount: wm.get(m.listingId) ?? 0 }));
  }, [data]);

  const filteredRows = useMemo(() => {
    if (!searchQuery) return tableRows;
    const q = searchQuery.toLowerCase();
    return tableRows.filter((r) => r.productName.toLowerCase().includes(q));
  }, [tableRows, searchQuery]);

  if (err || !data) {
    return (
      <div className="mx-auto max-w-7xl">
        <p className="text-sm text-muted">{err ?? "Loading…"}</p>
      </div>
    );
  }

  const columns: Column<MarketTableRow>[] = [
    {
      header: "Product",
      key: "productName",
      width: 220,
      cellClassName: "whitespace-normal max-w-[240px] font-semibold text-slate-800",
      render: (m) => m.productName,
    },
    {
      header: "Your price",
      key: "myPrice",
      width: 110,
      cellClassName: "text-xs font-bold text-slate-800",
      render: (m) => `₹${m.myPrice.toLocaleString("en-IN")}`,
    },
    {
      header: "Market avg",
      key: "marketAvg",
      width: 110,
      cellClassName: "text-xs text-slate-700",
      render: (m) =>
        m.marketAvg != null ? `₹${Math.round(m.marketAvg).toLocaleString("en-IN")}` : "—",
    },
    {
      header: "Difference",
      key: "diff",
      width: 160,
      cellClassName: "whitespace-normal text-xs font-bold",
      render: (m) => {
        const pct = m.priceDiffPct;
        if (m.marketAvg == null) return <span className="text-slate-500">—</span>;
        const text =
          pct === 0 ? "At market avg" : pct > 0 ? `+${pct}% above avg` : `${pct}% below avg`;
        return <span className={diffClass(pct)}>{text}</span>;
      },
    },
    {
      header: "Watchers",
      key: "watchers",
      width: 180,
      cellClassName: "whitespace-normal",
      render: (m) => {
        const w = m.watchCount;
        return (
          <span className="inline-flex flex-wrap items-center gap-1 text-xs text-slate-700">
            <Bell className="h-3.5 w-3.5 shrink-0" />
            {w} {w === 1 ? "buyer" : "buyers"}
            {w > 5 ? (
              <span className="rounded border border-amber-200 bg-amber-50 px-1.5 text-[10px] font-black uppercase tracking-tight text-amber-900">
                High demand
              </span>
            ) : null}
          </span>
        );
      },
    },
    {
      header: "Recommendation",
      key: "reco",
      width: 200,
      cellClassName: "whitespace-normal",
      render: (m) => {
        const chip = recoChip(m.priceDiffPct);
        return (
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${chip.cls}`}>
            {chip.label}
          </span>
        );
      },
    },
  ];

  const stale = data.stockAge.filter((s) => s.daysListed > 30 && s.totalSales === 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <CommonTable
        title="Market intelligence"
        subtitle={undefined}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Searching..."
        columns={columns}
        data={filteredRows}
        keyExtractor={(m) => m.listingId}
        emptyMessage="No listing data"
      />

      <section className="space-y-3">
        <h2 className="px-2 text-sm font-black tracking-tight text-slate-900">Bid gap analysis</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.bidGaps
            .filter((b) => b.avgBidPrice != null)
            .map((b) => (
              <div
                key={b.listingId}
                className="rounded-md border border-slate-200 bg-white p-4 text-sm shadow-sm"
              >
                <p>
                  Customers bid avg <strong>₹{b.avgBidPrice!.toLocaleString("en-IN")}</strong> / unit.
                </p>
                <p className="mt-1 text-muted">Your minimum bid: ₹{b.minBidPrice.toLocaleString("en-IN")}</p>
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
          <h2 className="px-2 text-sm font-black tracking-tight text-slate-900">Stock age alerts</h2>
          <ul className="mt-2 space-y-2">
            {stale.map((s) => (
              <li
                key={s.listingId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm shadow-sm"
              >
                <span className="text-red-900">
                  Listed {s.daysListed} days · No sales — consider a 10–15% price test.
                </span>
                <Link href="/vendor/products" className="text-amber-600 hover:underline">
                  Edit listing
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.demandSignals.length > 0 ? (
        <section>
          <h2 className="px-2 text-sm font-black tracking-tight text-slate-900">Demand signals</h2>
          <p className="mt-1 px-2 text-xs text-muted">Watched products you don&apos;t list yet.</p>
          <ul className="mt-3 space-y-2">
            {data.demandSignals.map((d) => (
              <li
                key={d.productId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm"
              >
                <span>
                  <strong>{d.name}</strong> — {d.watchers} active watches
                </span>
                <Link href="/vendor/products" className="text-amber-600 hover:underline">
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
