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
  { value: "", label: "All" },
  { value: "Brand New", label: "Brand New" },
  { value: "Refurb A+", label: "Refurb A+" },
  { value: "Refurb A", label: "Refurb A" },
  { value: "Refurb B", label: "Refurb B" },
];

const BRAND_CHIPS = ["Dell", "Lenovo", "HP"] as const;

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
  return s ? `/sales/lots?${s}` : "/sales/lots";
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

  const currentFilters: { brand?: string; condition?: string; sort?: string } = {};
  if (brand) currentFilters.brand = brand;
  if (conditionRaw) currentFilters.condition = conditionRaw;
  if (sort !== "default") currentFilters.sort = sort;

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

  const sorted = sortLots(filtered, sort);

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-navy px-4 py-6">
        <div className="mx-auto max-w-7xl">
          <nav className="text-[11px] text-white/40">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-1">/</span>
            <span className="text-white/60">Lot sales</span>
          </nav>
          <h1 className="mt-2 text-2xl font-medium text-white">Bulk Lot Sales</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-white/45">
            Verified bulk laptop inventory — mixed brands and grades, priced per lot.
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
                      : "border-white/20 text-white/60 hover:border-amber hover:text-amber"
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
                      : "border-white/20 text-white/60 hover:border-amber hover:text-amber"
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
          <p className="text-[12px] text-ink-muted">{sorted.length} lot sales</p>
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
            <button type="submit" className="text-[11px] font-medium text-lot hover:underline">
              Apply
            </button>
          </form>
        </div>

        {sorted.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={PackageSearch}
            title="No lots match your filters"
            description="Try clearing filters or browse the full catalog."
            cta={{ label: "Clear filters", href: "/sales/lots" }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
