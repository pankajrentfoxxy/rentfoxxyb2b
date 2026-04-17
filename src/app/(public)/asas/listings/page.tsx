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
  { value: "", label: "All" },
  { value: "Brand New", label: "Brand New" },
  { value: "Refurb A+", label: "Refurb A+" },
  { value: "Refurb A", label: "Refurb A" },
  { value: "Refurb B", label: "Refurb B" },
  { value: "Refurb C", label: "Refurb C" },
];

const BRAND_CHIPS = ["Dell", "Lenovo", "HP"] as const;

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

function chipHref(
  current: { brand?: string; condition?: string; sort?: string },
  patch: Partial<Record<"brand" | "condition" | "sort", string | null>>,
) {
  const next: Record<string, string> = { ...current };
  (Object.entries(patch) as [string, string | null | undefined][]).forEach(([k, v]) => {
    if (v == null || v === "") delete next[k];
    else next[k] = v;
  });
  const p = new URLSearchParams();
  Object.entries(next).forEach(([k, v]) => {
    if (v) p.set(k, v);
  });
  const s = p.toString();
  return s ? `/asas/listings?${s}` : "/asas/listings";
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

  const currentFilters: { brand?: string; condition?: string; sort?: string } = {};
  if (brand) currentFilters.brand = brand;
  if (conditionRaw) currentFilters.condition = conditionRaw;
  if (sort !== "default") currentFilters.sort = sort;

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

  const sorted = sortAsAs(withAvail, sort);

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-gradient-to-r from-[#3B0764] to-[#4C1D95] px-4 py-6">
        <div className="mx-auto max-w-7xl">
          <nav className="text-[11px] text-white/50">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-1">/</span>
            <span className="text-white/70">AsAs</span>
          </nav>
          <h1 className="mt-2 text-2xl font-medium text-white">AsAs Fleet Deals</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-white/50">
            Whole-listing clearance — mixed fleet, as-is grading.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {CONDITION_FILTERS.map((c) => {
              const active = conditionRaw === c.value || (c.value === "" && !conditionRaw);
              const href = chipHref(currentFilters, {
                condition: c.value === "" ? null : c.value,
                sort: sort !== "default" ? sort : null,
              });
              return (
                <Link
                  key={c.label}
                  href={href}
                  className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                    active
                      ? "border-amber text-amber"
                      : "border-white/25 text-white/65 hover:border-asas-border hover:text-asas-border"
                  }`}
                >
                  {c.label}
                </Link>
              );
            })}
            {BRAND_CHIPS.map((b) => {
              const active = brand.toLowerCase() === b.toLowerCase();
              const href = chipHref(currentFilters, {
                brand: active ? null : b,
                sort: sort !== "default" ? sort : null,
              });
              return (
                <Link
                  key={b}
                  href={href}
                  className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                    active
                      ? "border-amber text-amber"
                      : "border-white/25 text-white/65 hover:border-asas-border hover:text-asas-border"
                  }`}
                >
                  {b}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] text-ink-muted">{sorted.length} listings</p>
          <form method="get" className="flex items-center gap-2">
            {brand ? <input type="hidden" name="brand" value={brand} /> : null}
            {conditionRaw ? <input type="hidden" name="condition" value={conditionRaw} /> : null}
            <select
              name="sort"
              defaultValue={sort}
              className="rounded border border-border bg-card px-2 py-1.5 text-[11px] text-ink-secondary"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button type="submit" className="text-[11px] font-medium text-asas hover:underline">
              Apply
            </button>
          </form>
        </div>

        {sorted.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={Layers}
            title="No listings match your filters"
            description="Try different filters or browse catalog products."
            cta={{ label: "Clear filters", href: "/asas/listings" }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
