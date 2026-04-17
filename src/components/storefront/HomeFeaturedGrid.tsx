"use client";

import { ProductCard } from "@/components/storefront/ProductCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { PublicProductCard } from "@/lib/public-api";
import Link from "next/link";
import { useMemo, useState } from "react";

type Filter = "all" | "business" | "brandNew" | "refurbAplus";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "business", label: "Business" },
  { id: "brandNew", label: "Brand New" },
  { id: "refurbAplus", label: "Refurb A+" },
];

function matchesFilter(p: PublicProductCard, f: Filter): boolean {
  if (f === "all") return true;
  // "Business" pill = laptops category (B2B laptop SKUs)
  if (f === "business") return p.category.slug.toLowerCase() === "laptops";
  if (f === "brandNew") return p.distinctConditions.includes("BRAND_NEW");
  if (f === "refurbAplus") return p.distinctConditions.includes("REFURB_A_PLUS");
  return true;
}

export function HomeFeaturedGrid({ products }: { products: PublicProductCard[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => products.filter((p) => matchesFilter(p, filter)), [products, filter]);

  if (!products.length) return null;

  return (
    <section className="bg-surface py-6 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel color="lot">Individual Products</SectionLabel>
            <h2 className="mt-1.5 text-[17px] font-medium text-ink-primary">Featured catalog</h2>
            <p className="text-[13px] text-ink-muted">Hand-picked SKUs with competitive B2B pricing</p>
          </div>
          <Link href="/products" className="text-sm text-lot hover:underline">
            See all products →
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === tab.id
                  ? "border-navy bg-navy text-white"
                  : "border-border bg-card text-ink-secondary hover:border-navy/30"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">No products match this filter.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} showCartAction={false} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
