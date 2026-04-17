"use client";

import { DualPriceRange } from "@/components/storefront/filters/DualPriceRange";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProductCard, ViewModeToggle } from "@/components/storefront/ProductCard";
import { BTN } from "@/constants/design";
import { GRADE_CONFIG, GRADE_ORDER } from "@/constants/grading";
import { CPU_OPTS, type PublicProductCard } from "@/lib/public-api";
import type { ProductCondition } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Loader2, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const FILTER_BRANDS = ["Dell", "Lenovo", "HP", "Apple", "ASUS", "Acer"] as const;
const RAM_PILLS = ["4GB", "8GB", "16GB", "32GB", "64GB"] as const;
const PRICE_MIN = 0;
const PRICE_MAX = 800000;

type FilterMeta = {
  ramOptions: string[];
  cpuOptions: string[];
  brands: string[];
};

function FilterCheckbox({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-1 text-[12px] text-ink-secondary">
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <span
        className={cn(
          "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors",
          checked ? "border-navy bg-navy" : "border-border bg-white",
        )}
        aria-hidden
      >
        {checked ? <span className="text-[9px] leading-none text-white">✓</span> : null}
      </span>
      <span className="flex-1">{label}</span>
      {count != null ? <span className="ml-auto text-[10px] tabular-nums text-ink-muted">{count}</span> : null}
    </label>
  );
}

const CONDITIONS_LIST = (GRADE_ORDER as ProductCondition[]).filter((c) => c !== "REFURB_D");

export function ProductsBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<PublicProductCard[]>([]);
  const [meta, setMeta] = useState<FilterMeta | null>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filterKey = useMemo(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("page");
    return p.toString();
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const qs = filterKey ? `${filterKey}&` : "";
        const res = await fetch(`/api/public/products?${qs}page=1`);
        const data = await res.json();
        if (cancelled) return;
        setProducts(data.products ?? []);
        setPagination({
          page: data.pagination?.page ?? 1,
          totalPages: data.pagination?.totalPages ?? 1,
          total: data.pagination?.total ?? 0,
          limit: data.pagination?.limit ?? 20,
        });
        setMeta(data.filterMeta ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterKey]);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const p = new URLSearchParams(searchParams.toString());
      p.delete("page");
      Object.entries(updates).forEach(([k, v]) => {
        if (v == null || v === "") p.delete(k);
        else p.set(k, v);
      });
      router.push(`/products?${p.toString()}`);
    },
    [router, searchParams],
  );

  const category = searchParams.get("category") ?? "";
  const brandStr = searchParams.get("brand") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const ramStr = searchParams.get("ram") ?? "";
  const cpuStr = searchParams.get("cpu") ?? "";
  const condStr = searchParams.get("condition") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const search = searchParams.get("search") ?? "";

  const ramSel = ramStr ? ramStr.split(",").filter(Boolean) : [];
  const cpuSel = cpuStr ? cpuStr.split(",").filter(Boolean) : [];
  const brandSel = brandStr ? brandStr.split(",").filter(Boolean) : [];
  const condSel = condStr ? condStr.split(",").filter(Boolean) : [];

  const numMin = minPrice ? Number(minPrice) : PRICE_MIN;
  const numMax = maxPrice ? Number(maxPrice) : PRICE_MAX;

  const hasActiveFilters =
    !!category ||
    brandSel.length > 0 ||
    condSel.length > 0 ||
    ramSel.length > 0 ||
    cpuSel.length > 0 ||
    !!search ||
    (minPrice !== "" && numMin > PRICE_MIN) ||
    (maxPrice !== "" && numMax < PRICE_MAX);

  function toggleMulti(key: "ram" | "cpu" | "brand", value: string) {
    const cur = key === "ram" ? ramSel : key === "cpu" ? cpuSel : brandSel;
    const next = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
    updateParams({ [key]: next.length ? next.join(",") : undefined });
  }

  function toggleCondition(value: ProductCondition) {
    const next = condSel.includes(value) ? condSel.filter((x) => x !== value) : [...condSel, value];
    updateParams({ condition: next.length ? next.join(",") : undefined });
  }

  async function loadMore() {
    if (pagination.page >= pagination.totalPages || loadingMore) return;
    setLoadingMore(true);
    try {
      const qs = filterKey ? `${filterKey}&` : "";
      const nextPage = pagination.page + 1;
      const res = await fetch(`/api/public/products?${qs}page=${nextPage}`);
      const data = await res.json();
      setProducts((prev) => [...prev, ...(data.products ?? [])]);
      setPagination({
        page: data.pagination?.page ?? nextPage,
        totalPages: data.pagination?.totalPages ?? 1,
        total: data.pagination?.total ?? 0,
        limit: data.pagination?.limit ?? 20,
      });
    } finally {
      setLoadingMore(false);
    }
  }

  const showing = products.length;
  const total = pagination.total;

  return (
    <div className="bg-surface py-4">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-4 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-[58px] lg:h-fit">
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-[13px] font-medium text-ink-primary">Filters</h2>

            <div className="mb-3">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-ink-muted">Search</p>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                <input
                  defaultValue={search}
                  className="w-full rounded-lg border border-border py-2 pl-8 pr-2 text-[12px] text-ink-primary"
                  placeholder="SKU, brand, model…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateParams({ search: (e.target as HTMLInputElement).value || undefined });
                    }
                  }}
                />
              </div>
            </div>

            <div className="border-t border-border-light my-3" />

            <CategoryRadios category={category} setCategory={(slug) => updateParams({ category: slug || undefined })} />

            <div className="border-t border-border-light my-3" />

            <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-ink-muted">Condition</p>
            <div className="space-y-0.5">
              {CONDITIONS_LIST.map((key) => {
                const g = GRADE_CONFIG[key];
                return (
                  <FilterCheckbox
                    key={key}
                    checked={condSel.includes(key)}
                    onChange={() => toggleCondition(key)}
                    label={g.label}
                  />
                );
              })}
            </div>

            <div className="border-t border-border-light my-3" />

            <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-ink-muted">Brand</p>
            <div className="space-y-0.5">
              {FILTER_BRANDS.map((b) => (
                <FilterCheckbox
                  key={b}
                  checked={brandSel.includes(b)}
                  onChange={() => toggleMulti("brand", b)}
                  label={b}
                />
              ))}
            </div>

            <div className="border-t border-border-light my-3" />

            <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-ink-muted">Price range</p>
            <DualPriceRange
              min={PRICE_MIN}
              max={PRICE_MAX}
              valueMin={Number.isFinite(numMin) ? numMin : PRICE_MIN}
              valueMax={Number.isFinite(numMax) ? numMax : PRICE_MAX}
              onChange={(a, b) => {
                updateParams({
                  minPrice: a <= PRICE_MIN ? undefined : String(a),
                  maxPrice: b >= PRICE_MAX ? undefined : String(b),
                });
              }}
            />

            <div className="border-t border-border-light my-3" />

            <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-ink-muted">Processor</p>
            <div className="max-h-36 space-y-0.5 overflow-y-auto">
              {(meta?.cpuOptions?.length ? meta.cpuOptions : CPU_OPTS).map((c) => (
                <FilterCheckbox
                  key={c}
                  checked={cpuSel.includes(c)}
                  onChange={() => toggleMulti("cpu", c)}
                  label={c}
                />
              ))}
            </div>

            <div className="border-t border-border-light my-3" />

            <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-ink-muted">RAM</p>
            <div className="flex flex-wrap gap-1.5">
              {RAM_PILLS.map((r) => {
                const on = ramSel.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleMulti("ram", r)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      on
                        ? "border-navy bg-navy text-white"
                        : "border-border bg-white text-ink-secondary hover:border-navy/30",
                    )}
                  >
                    {r}
                  </button>
                );
              })}
            </div>

            {hasActiveFilters ? (
              <div className="mt-3 rounded-lg border border-amber-border bg-amber-bg p-3">
                <p className="text-[11px] text-amber-dark">Filters are active — showing matching catalog SKUs.</p>
                <button
                  type="button"
                  className="mt-2 text-[11px] font-medium text-navy hover:underline"
                  onClick={() => router.push("/products")}
                >
                  Clear all
                </button>
              </div>
            ) : null}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-ink-muted">
              {loading ? "Loading…" : `Showing ${showing} of ${total} products`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={sort}
                className="rounded border border-border bg-card px-2 py-1.5 text-[11px] text-ink-secondary"
                onChange={(e) => updateParams({ sort: e.target.value })}
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Most options</option>
              </select>
              <ViewModeToggle mode={viewMode} setMode={setViewMode} />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-navy" />
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No products found"
              description="Try adjusting filters or search keywords."
              cta={{ label: "Clear filters", href: "/products" }}
              className="mt-8"
            />
          ) : (
            <>
              <div
                className={cn(
                  "grid gap-3",
                  viewMode === "grid" ? "grid-cols-2 md:grid-cols-3" : "flex flex-col",
                )}
              >
                {products.map((p) => (
                  <ProductCard key={`${p.id}-${p.slug}`} product={p} listMode={viewMode === "list"} />
                ))}
              </div>

              {pagination.page < pagination.totalPages ? (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={loadMore}
                    className={cn(BTN.ghost, "px-6")}
                  >
                    {loadingMore ? "Loading…" : "Load 20 more products"}
                  </button>
                </div>
              ) : null}

            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryRadios({
  category,
  setCategory,
}: {
  category: string;
  setCategory: (slug: string) => void;
}) {
  const [cats, setCats] = useState<{ slug: string; name: string }[]>([]);
  useEffect(() => {
    fetch("/api/public/categories")
      .then((r) => r.json())
      .then((d) =>
        setCats((d.categories ?? []).map((c: { slug: string; name: string }) => ({ slug: c.slug, name: c.name }))),
      );
  }, []);

  return (
    <div>
      <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-ink-muted">Category</p>
      <div className="max-h-40 space-y-0.5 overflow-y-auto text-[12px]">
        <FilterCheckbox checked={!category} onChange={() => setCategory("")} label="All categories" />
        {cats.map((c) => (
          <FilterCheckbox
            key={c.slug}
            checked={category === c.slug}
            onChange={() => setCategory(c.slug)}
            label={c.name}
          />
        ))}
      </div>
    </div>
  );
}
