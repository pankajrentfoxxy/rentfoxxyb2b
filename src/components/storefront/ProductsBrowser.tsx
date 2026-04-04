"use client";

import { EmptyState } from "@/components/shared/EmptyState";
import { ProductCard, ViewModeToggle } from "@/components/storefront/ProductCard";
import { GRADE_CONFIG, GRADE_ORDER } from "@/constants/grading";
import type { PublicProductCard } from "@/lib/public-api";
import type { ProductCondition } from "@prisma/client";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type FilterMeta = {
  ramOptions: string[];
  cpuOptions: string[];
  brands: string[];
};

export function ProductsBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<PublicProductCard[]>([]);
  const [meta, setMeta] = useState<FilterMeta | null>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const q = searchParams.toString();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/products?${q}`);
      const data = await res.json();
      setProducts(data.products ?? []);
      setPagination(data.pagination ?? { page: 1, totalPages: 1, total: 0 });
      setMeta(data.filterMeta ?? null);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  function updateParams(updates: Record<string, string | undefined>) {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v == null || v === "") p.delete(k);
      else p.set(k, v);
    });
    if (!("page" in updates)) p.set("page", "1");
    router.push(`/products?${p.toString()}`);
  }

  const category = searchParams.get("category") ?? "";
  const brandStr = searchParams.get("brand") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const ramStr = searchParams.get("ram") ?? "";
  const cpuStr = searchParams.get("cpu") ?? "";
  const condStr = searchParams.get("condition") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const ramSel = ramStr ? ramStr.split(",").filter(Boolean) : [];
  const cpuSel = cpuStr ? cpuStr.split(",").filter(Boolean) : [];
  const brandSel = brandStr ? brandStr.split(",").filter(Boolean) : [];
  const condSel = condStr ? condStr.split(",").filter(Boolean) : [];

  function toggleMulti(key: "ram" | "cpu" | "brand", value: string) {
    const cur =
      key === "ram" ? ramSel : key === "cpu" ? cpuSel : brandSel;
    const next = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
    const encoded = next.join(",");
    updateParams({ [key]: encoded || undefined });
  }

  function toggleCondition(value: ProductCondition) {
    const next = condSel.includes(value) ? condSel.filter((x) => x !== value) : [...condSel, value];
    updateParams({ condition: next.length ? next.join(",") : undefined });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="lg:sticky lg:top-24 lg:w-64 lg:shrink-0">
          <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <label className="text-sm font-semibold text-slate-800">Search</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  defaultValue={search}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-2 text-sm"
                  placeholder="SKU, brand, model…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateParams({ search: (e.target as HTMLInputElement).value || undefined });
                    }
                  }}
                />
              </div>
            </div>

            <CategoryCheckboxes
              category={category}
              setCategory={(slug) => updateParams({ category: slug || undefined })}
            />

            <div>
              <p className="text-sm font-semibold text-slate-800">Brand</p>
              <div className="mt-2 max-h-36 space-y-1 overflow-y-auto text-sm">
                {(meta?.brands ?? []).map((b) => (
                  <label key={b} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={brandSel.includes(b)}
                      onChange={() => toggleMulti("brand", b)}
                    />
                    {b}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">Price (₹)</p>
              <div className="mt-2 flex gap-2">
                <input
                  type="number"
                  className="w-full rounded border px-2 py-1 text-sm"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => updateParams({ minPrice: e.target.value || undefined })}
                />
                <input
                  type="number"
                  className="w-full rounded border px-2 py-1 text-sm"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => updateParams({ maxPrice: e.target.value || undefined })}
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">Product condition</p>
              <div className="mt-2 space-y-1 text-sm">
                {(GRADE_ORDER as ProductCondition[]).map((key) => {
                  const g = GRADE_CONFIG[key];
                  return (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={condSel.includes(key)}
                        onChange={() => toggleCondition(key)}
                      />
                      <span className="text-base leading-none" style={{ color: g.color }}>
                        {g.dot}
                      </span>
                      {g.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">RAM</p>
              <div className="mt-2 space-y-1 text-sm">
                {["4GB", "8GB", "16GB", "32GB"].map((r) => (
                  <label key={r} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={ramSel.includes(r)}
                      onChange={() => toggleMulti("ram", r)}
                    />
                    {r}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">Processor</p>
              <div className="mt-2 max-h-32 space-y-1 overflow-y-auto text-sm">
                {(meta?.cpuOptions ?? []).map((c) => (
                  <label key={c} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={cpuSel.includes(c)}
                      onChange={() => toggleMulti("cpu", c)}
                    />
                    {c}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-surface"
              onClick={() => router.push("/products")}
            >
              Clear all filters
            </button>
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              {loading ? "Loading…" : `${pagination.total} products`}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={sort}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                onChange={(e) => updateParams({ sort: e.target.value })}
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Most popular</option>
              </select>
              <ViewModeToggle mode={viewMode} setMode={setViewMode} />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-accent" />
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
            <div
              className={cn(
                "mt-8 gap-6",
                viewMode === "grid" ? "grid sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col",
              )}
            >
              {products.map((p) => (
                <ProductCard key={p.id} product={p} listMode={viewMode === "list"} />
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="text-sm text-muted">
                Page {page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryCheckboxes({
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
      <p className="text-sm font-semibold text-slate-800">Category</p>
      <div className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" name="cat2" checked={!category} onChange={() => setCategory("")} />
          All
        </label>
        {cats.map((c) => (
          <label key={c.slug} className="flex items-center gap-2">
            <input
              type="radio"
              name="cat2"
              checked={category === c.slug}
              onChange={() => setCategory(c.slug)}
            />
            {c.name}
          </label>
        ))}
      </div>
    </div>
  );
}
