"use client";

import { WatchButton } from "@/components/storefront/WatchButton";
import { ConditionBadge } from "@/components/ui/ConditionBadge";
import { isUsableImageSrc } from "@/lib/image-url";
import type { PublicProductCard } from "@/lib/public-api";
import { useCompareStore } from "@/store/compareStore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const SPEC_ROWS: { key: string; label: string }[] = [
  { key: "cpu", label: "Processor" },
  { key: "chip", label: "Processor" },
  { key: "Processor", label: "Processor" },
  { key: "ram", label: "RAM" },
  { key: "RAM", label: "RAM" },
  { key: "storage", label: "Storage" },
  { key: "Storage", label: "Storage" },
  { key: "display", label: "Display" },
  { key: "Display", label: "Display" },
  { key: "weight", label: "Weight" },
  { key: "os", label: "OS" },
];

function specVal(specs: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = specs[k];
    if (v != null && String(v).length) return String(v);
  }
  return "—";
}

export default function ComparePage() {
  const { items, removeItem, clearAll } = useCompareStore();
  const [loaded, setLoaded] = useState<Record<string, PublicProductCard | null>>({});
  const [reco, setReco] = useState<Record<string, unknown> | null>(null);
  const [recoBusy, setRecoBusy] = useState(false);
  const [recoErr, setRecoErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, PublicProductCard | null> = {};
      await Promise.all(
        items.map(async (it) => {
          const res = await fetch(`/api/public/products/${it.slug}`);
          if (!res.ok) {
            next[it.id] = null;
            return;
          }
          const j = (await res.json()) as { product?: PublicProductCard };
          next[it.id] = j.product ?? null;
        }),
      );
      if (!cancelled) setLoaded(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const cols = useMemo(
    () => items.map((it) => ({ item: it, full: loaded[it.id] })),
    [items, loaded],
  );

  async function analyse() {
    setRecoBusy(true);
    setRecoErr(null);
    try {
      const res = await fetch("/api/public/compare/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: items.map((i) => i.id) }),
      });
      const j = await res.json();
      if (!res.ok) {
        setRecoErr(typeof j.error === "string" ? j.error : "Failed");
        return;
      }
      setReco(j as Record<string, unknown>);
    } finally {
      setRecoBusy(false);
    }
  }

  async function downloadPdf() {
    const res = await fetch("/api/public/compare/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: items.map((i) => i.id) }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rentfoxxy-compare.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-ink-primary">Compare</h1>
        <p className="mt-2 text-sm text-ink-muted">Add at least two products from the storefront to compare.</p>
        <Link href="/products" className="mt-6 inline-block text-lot hover:underline">
          Browse products
        </Link>
      </div>
    );
  }

  const numericRows = [
    { label: "Min price (₹)", get: (p: PublicProductCard) => p.priceMin },
    { label: "Options", get: (p: PublicProductCard) => p.optionCount },
    { label: "MOQ (best)", get: (p: PublicProductCard) => p.listings[0]?.minOrderQty ?? "—" },
    { label: "Stock (total)", get: (p: PublicProductCard) => p.totalStock },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Comparing {items.length} products</h1>
          <button type="button" onClick={clearAll} className="mt-1 text-[12px] text-lot hover:underline">
            Clear all
          </button>
        </div>
        <Link href="/products" className="text-[12px] font-medium text-ink-muted hover:text-navy">
          ← Continue shopping
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-[12px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-[120px] bg-surface px-2 py-3 font-medium text-ink-primary" />
              {cols.map(({ item, full }) => (
                <th key={item.id} className="min-w-[200px] border-l border-border px-3 py-3 align-top">
                  {!full ? (
                    <p className="text-ink-muted">Loading…</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex h-24 items-center justify-center rounded-lg bg-navy-light p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            isUsableImageSrc(full.images[0] ?? "")
                              ? full.images[0]!
                              : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='60'/%3E"
                          }
                          alt=""
                          className="max-h-20 object-contain"
                        />
                      </div>
                      <p className="font-medium text-ink-primary">{full.name}</p>
                      <p className="text-[10px] text-ink-muted">{full.brand}</p>
                      {full.listings[0] ? (
                        <ConditionBadge condition={full.listings[0].condition} size="sm" />
                      ) : null}
                      <WatchButton
                        productId={full.id}
                        productSlug={full.slug}
                        currentMinPrice={full.priceMin}
                        compact
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-[11px] text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SPEC_ROWS.filter((row, i, a) => a.findIndex((x) => x.label === row.label) === i).map((row) => (
              <tr key={row.label} className="border-t border-border">
                <td className="sticky left-0 z-10 bg-surface px-2 py-2 font-medium text-ink-primary">{row.label}</td>
                {cols.map(({ item, full }) => (
                  <td key={item.id} className="border-l border-border px-3 py-2 text-ink-secondary">
                    {full ? specVal(full.specs as Record<string, unknown>, [row.key]) : "—"}
                  </td>
                ))}
              </tr>
            ))}
            {numericRows.map((nr) => {
              const vals = cols
                .map(({ full }) => (full ? nr.get(full) : null))
                .filter((v): v is number => typeof v === "number");
              const best = nr.label.startsWith("Min") && vals.length ? Math.min(...vals) : null;
              return (
                <tr key={nr.label} className="border-t border-border">
                  <td className="sticky left-0 z-10 bg-surface px-2 py-2 font-medium text-ink-primary">
                    {nr.label}
                  </td>
                  {cols.map(({ item, full }) => {
                    const v = full ? nr.get(full) : "—";
                    const num = typeof v === "number" ? v : null;
                    const highlight = best != null && num === best;
                    return (
                      <td
                        key={item.id}
                        className={`border-l border-border px-3 py-2 ${
                          highlight ? "bg-verified-bg font-semibold text-verified-text" : "text-ink-secondary"
                        }`}
                      >
                        {typeof v === "number" ? v.toLocaleString("en-IN") : v}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr className="border-t border-border">
              <td className="sticky left-0 z-10 bg-surface px-2 py-2 font-medium text-ink-primary">
                Condition range
              </td>
              {cols.map(({ item, full }) => (
                <td key={item.id} className="border-l border-border px-3 py-2 text-ink-secondary">
                  {full?.distinctConditions?.length
                    ? full.distinctConditions.join(", ")
                    : "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <section className="mt-10 rounded-xl border border-border bg-card p-6">
        <h2 className="text-[14px] font-semibold text-ink-primary">AI recommendation</h2>
        <p className="mt-1 text-[12px] text-ink-muted">
          Uses Gemini when <code className="rounded bg-surface px-1">GEMINI_API_KEY</code> is set.
        </p>
        <button
          type="button"
          disabled={recoBusy || items.length < 2}
          onClick={() => void analyse()}
          className="mt-4 rounded-lg bg-navy px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
        >
          {recoBusy ? "Analysing…" : "Analyse & recommend"}
        </button>
        {recoErr ? <p className="mt-2 text-[12px] text-red-600">{recoErr}</p> : null}
        {reco ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(["bestForPerformance", "bestForBudget", "bestValueOverall"] as const).map((k) => (
              <div key={k} className="rounded-lg border border-amber-border bg-amber-bg/40 p-3">
                <p className="text-[10px] font-medium uppercase text-amber-dark">{k.replace(/([A-Z])/g, " $1")}</p>
                <p className="mt-1 text-[13px] font-semibold text-ink-primary">{String(reco[k] ?? "—")}</p>
              </div>
            ))}
            <div className="sm:col-span-3 rounded-lg border border-border bg-surface p-3 text-[12px] text-ink-secondary">
              {String(reco.summary ?? "")}
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => void downloadPdf()}
          className="mt-4 rounded-lg border border-border px-4 py-2 text-[12px] font-medium text-ink-primary hover:bg-surface"
        >
          Download comparison as PDF
        </button>
      </section>
    </div>
  );
}
