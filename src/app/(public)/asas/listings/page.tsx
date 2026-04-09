import { EmptyState } from "@/components/shared/EmptyState";
import { AsAsCard } from "@/components/storefront/AsAsCard";
import {
  asasInventoryCap,
  asasPublicLotProgress,
  asasUnitsAvailableFromPurchases,
  asasUnitsSoldFromPurchases,
} from "@/lib/asas-inventory";
import { humanConditionToPrisma } from "@/lib/lot-ai-cleaner";
import { prisma } from "@/lib/prisma";
import type { LotItemCondition } from "@prisma/client";
import { Layers } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const SORT_OPTIONS = [
  { value: "default", label: "Newest" },
  { value: "units_avail", label: "Most units left" },
  { value: "price_asc", label: "Avg price · low to high" },
  { value: "price_desc", label: "Avg price · high to low" },
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

function sortAsAs<
  T extends {
    avgUnitPrice: number;
    createdAt: Date;
    _avail: number;
  },
>(rows: T[], sort: SortKey): T[] {
  const copy = [...rows];
  if (sort === "price_asc") copy.sort((a, b) => a.avgUnitPrice - b.avgUnitPrice);
  else if (sort === "price_desc") copy.sort((a, b) => b.avgUnitPrice - a.avgUnitPrice);
  else if (sort === "units_avail") copy.sort((a, b) => b._avail - a._avail);
  else copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return copy;
}

export default async function AsAsListingsPage({
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
    sortParam === "price_asc" || sortParam === "price_desc" || sortParam === "units_avail"
      ? sortParam
      : "default";

  const listings = await prisma.asAsListing.findMany({
    where: { status: "LIVE" },
    orderBy: { createdAt: "desc" },
    take: 240,
    include: {
      vendor: { select: { companyName: true } },
      items: { select: { brand: true, condition: true, count: true } },
      purchases: { select: { quantity: true, status: true } },
    },
  });

  let filtered = listings;
  if (brand) {
    const b = brand.toLowerCase();
    filtered = filtered.filter((l) => l.items.some((i) => i.brand.toLowerCase().includes(b)));
  }
  if (conditionRaw) {
    const target = humanConditionToPrisma(conditionRaw);
    filtered = filtered.filter((l) => l.items.some((i) => i.condition === target));
  }

  const withAvail = filtered.map((l) => {
    const cap = asasInventoryCap(l, l.items);
    const unitsSold = asasUnitsSoldFromPurchases(l.purchases);
    const unitsAvailable = asasUnitsAvailableFromPurchases(l, l.items, l.purchases);
    return { ...l, _cap: cap, _unitsSold: unitsSold, _avail: unitsAvailable };
  });

  const sorted = sortAsAs(withAvail, sort).slice(0, 48);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">AsAs deals</h1>
      <p className="mt-2 text-muted">As-available-as-is fleet clearance</p>

      <form
        method="get"
        action="/asas/listings"
        className="mt-8 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="min-w-[140px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-slate-600">Brand contains</label>
          <input
            name="brand"
            defaultValue={brand}
            placeholder="e.g. Lenovo"
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
          className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800"
        >
          Apply
        </button>
        <Link
          href="/asas/listings"
          className="text-sm font-medium text-slate-600 underline-offset-4 hover:underline"
        >
          Clear
        </Link>
      </form>

      {sorted.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={Layers}
          title="No listings match your filters"
          description="Try different filters or browse catalog products."
          cta={{ label: "Clear filters", href: "/asas/listings" }}
        />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((l) => {
            const brands = Array.from(new Set(l.items.map((i) => i.brand))).slice(0, 3);
            const conditions = Array.from(new Set(l.items.map((i) => i.condition))) as LotItemCondition[];
            const lot = asasPublicLotProgress(l, l._cap, l._unitsSold);
            return (
              <AsAsCard
                key={l.id}
                id={l.id}
                title={l.title}
                description={l.description}
                brands={brands}
                conditions={conditions}
                unitsAvailable={l._avail}
                avgUnitPrice={l.avgUnitPrice}
                allowBidding={l.allowBidding}
                isLotMode={lot.isLotMode}
                totalLots={lot.totalLots}
                lotsSold={lot.lotsSold}
                lotsRemaining={lot.lotsRemaining}
                lotSize={lot.lotSize}
                percentSold={lot.percentSold}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
