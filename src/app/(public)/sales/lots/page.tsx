import { EmptyState } from "@/components/shared/EmptyState";
import { LotCard } from "@/components/storefront/LotCard";
import { humanConditionToPrisma } from "@/lib/lot-ai-cleaner";
import { prisma } from "@/lib/prisma";
import type { LotItemCondition } from "@prisma/client";
import { PackageSearch } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const SORT_OPTIONS = [
  { value: "default", label: "Most activity" },
  { value: "price_asc", label: "Price · low to high" },
  { value: "price_desc", label: "Price · high to low" },
  { value: "newest", label: "Newest listed" },
] as const;

const CONDITION_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Any condition" },
  { value: "Brand New", label: "Brand new" },
  { value: "Refurb A+", label: "Refurb A+" },
  { value: "Refurb A", label: "Refurb A" },
  { value: "Refurb B", label: "Refurb B" },
  { value: "Refurb C", label: "Refurb C" },
];

type SortKey = (typeof SORT_OPTIONS)[number]["value"];

function sortLots<T extends { pricePerLot: number; lotsSold: number; createdAt: Date }>(
  rows: T[],
  sort: SortKey,
): T[] {
  const copy = [...rows];
  if (sort === "price_asc") copy.sort((a, b) => a.pricePerLot - b.pricePerLot);
  else if (sort === "price_desc") copy.sort((a, b) => b.pricePerLot - a.pricePerLot);
  else if (sort === "newest") copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  else copy.sort((a, b) => b.lotsSold - a.lotsSold || b.createdAt.getTime() - a.createdAt.getTime());
  return copy;
}

export default async function PublicLotsIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const brand =
    typeof sp.brand === "string" ? decodeURIComponent(sp.brand.replace(/\+/g, " ")).trim() : "";
  const conditionRaw =
    typeof sp.condition === "string"
      ? decodeURIComponent(sp.condition.replace(/\+/g, " ")).trim()
      : "";
  const sortParam = typeof sp.sort === "string" ? sp.sort : "";
  const sort: SortKey =
    sortParam === "price_asc" || sortParam === "price_desc" || sortParam === "newest"
      ? sortParam
      : "default";

  const lots = await prisma.lotListing.findMany({
    where: { status: "LIVE" },
    orderBy: [{ lotsSold: "desc" }, { createdAt: "desc" }],
    take: 240,
    include: { vendor: { select: { companyName: true } }, items: { select: { brand: true, condition: true } } },
  });

  let filtered = lots;
  if (brand) {
    const b = brand.toLowerCase();
    filtered = filtered.filter((l) => l.items.some((i) => i.brand.toLowerCase().includes(b)));
  }
  if (conditionRaw) {
    const target = humanConditionToPrisma(conditionRaw);
    filtered = filtered.filter((l) => l.items.some((i) => i.condition === target));
  }

  const sorted = sortLots(filtered, sort).slice(0, 48);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Bulk lot sales</h1>
      <p className="mt-2 text-muted">Verified bulk laptop inventory</p>

      <form
        method="get"
        action="/sales/lots"
        className="mt-8 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="min-w-[140px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-slate-600">Brand contains</label>
          <input
            name="brand"
            defaultValue={brand}
            placeholder="e.g. Dell"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Condition</label>
          <select
            name="condition"
            defaultValue={conditionRaw}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {CONDITION_FILTERS.map((o) => (
              <option key={o.value || "any"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Sort</label>
          <select name="sort" defaultValue={sort} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          Apply
        </button>
        <Link href="/sales/lots" className="text-sm font-medium text-slate-600 underline-offset-4 hover:underline">
          Clear
        </Link>
      </form>

      {sorted.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={PackageSearch}
          title="No lots match your filters"
          description="Try clearing filters or browse the full catalog."
          cta={{ label: "Clear filters", href: "/sales/lots" }}
        />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((l) => {
            const brands = Array.from(new Set(l.items.map((i) => i.brand))).slice(0, 3);
            const conditions = Array.from(new Set(l.items.map((i) => i.condition))) as LotItemCondition[];
            const percentSold = l.totalLots > 0 ? Math.round((l.lotsSold / l.totalLots) * 100) : 0;
            return (
              <LotCard
                key={l.id}
                id={l.id}
                title={l.title}
                description={l.description}
                brands={brands}
                conditions={conditions}
                totalLots={l.totalLots}
                lotsSold={l.lotsSold}
                lotsRemaining={l.totalLots - l.lotsSold}
                lotSize={l.lotSize}
                pricePerLot={l.pricePerLot}
                percentSold={percentSold}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
