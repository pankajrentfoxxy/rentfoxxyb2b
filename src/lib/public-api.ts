import { CONDITION_SORT_RANK, GRADE_CONFIG } from "@/constants/grading";
import { normalizeProductImages } from "@/lib/image-url";
import type { Category, Product, ProductCondition, ProductListing } from "@prisma/client";

/** Listings visible on the storefront (Grade C must be admin-approved). */
export const STOREFRONT_LISTING_WHERE = {
  isActive: true,
  stockQty: { gt: 0 },
  requiresAdminApproval: false,
} as const;

export type PublicListing = {
  id: string;
  unitPrice: number;
  bulkPricing: unknown;
  stockQty: number;
  minOrderQty: number;
  label: string;
  condition: ProductCondition;
};

export type PublicProductCard = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  images: string[];
  specs: Record<string, unknown>;
  isFeatured: boolean;
  /** True after Rentfoxxy inspector has verified this product's inventory. */
  inspectorVerified: boolean;
  category: { name: string; slug: string };
  listings: PublicListing[];
  priceMin: number;
  priceMax: number;
  optionCount: number;
  totalStock: number;
  /** Distinct conditions among active storefront listings (for badges). */
  distinctConditions: ProductCondition[];
};

export function optionLabel(index: number): string {
  return `Option ${String.fromCharCode(65 + index)}`;
}

type ListingSlice = Pick<
  ProductListing,
  "id" | "unitPrice" | "bulkPricing" | "stockQty" | "minOrderQty" | "isActive" | "condition" | "requiresAdminApproval"
>;

export function mapListing(listing: ListingSlice, index: number): PublicListing {
  return {
    id: listing.id,
    unitPrice: listing.unitPrice,
    bulkPricing: listing.bulkPricing,
    stockQty: listing.stockQty,
    minOrderQty: listing.minOrderQty,
    label: optionLabel(index),
    condition: listing.condition,
  };
}

export function sortListingsForDisplay<
  T extends { unitPrice: number; condition: ProductCondition },
>(listings: T[]): T[] {
  return [...listings].sort((a, b) => {
    const rc = CONDITION_SORT_RANK[a.condition] - CONDITION_SORT_RANK[b.condition];
    if (rc !== 0) return rc;
    return a.unitPrice - b.unitPrice;
  });
}

export function mapProductPublic(
  product: Product & {
    category: Category;
    listings: ListingSlice[];
  },
): PublicProductCard {
  const active = product.listings
    .filter((l) => l.isActive && l.stockQty > 0 && !l.requiresAdminApproval)
    .sort((a, b) => {
      const rc = CONDITION_SORT_RANK[a.condition] - CONDITION_SORT_RANK[b.condition];
      if (rc !== 0) return rc;
      return a.unitPrice - b.unitPrice;
    });
  const allForPrice = product.listings.filter(
    (l) => l.isActive && l.stockQty > 0 && !l.requiresAdminApproval,
  );
  const prices = allForPrice.map((l) => l.unitPrice);
  const priceMin = prices.length ? Math.min(...prices) : 0;
  const priceMax = prices.length ? Math.max(...prices) : 0;
  const totalStock = allForPrice.reduce((s, l) => s + l.stockQty, 0);
  const distinctConditions = Array.from(new Set(active.map((l) => l.condition))).sort(
    (a, b) => CONDITION_SORT_RANK[a] - CONDITION_SORT_RANK[b],
  );

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    description: product.description,
    images: normalizeProductImages(product.images),
    specs: product.specs as Record<string, unknown>,
    isFeatured: product.isFeatured,
    inspectorVerified: product.inspectorVerified,
    category: { name: product.category.name, slug: product.category.slug },
    listings: active.map((l, i) => mapListing(l, i)),
    priceMin,
    priceMax,
    optionCount: active.length,
    totalStock,
    distinctConditions,
  };
}

export function gradeBadge(condition: ProductCondition) {
  const g = GRADE_CONFIG[condition];
  return { ...g, condition };
}

export function specsSummary(specs: Record<string, unknown>): string {
  const ram = specs.ram ?? specs.RAM;
  const storage = specs.storage ?? specs.Storage;
  const cpu = specs.cpu ?? specs.chip ?? specs.CPU ?? specs.Processor;
  const parts = [ram, storage, cpu].filter(Boolean);
  return parts.slice(0, 3).join(" · ") || "";
}

const RAM_OPTS = ["4GB", "8GB", "16GB", "32GB", "36GB", "64GB"];
const CPU_OPTS = ["Intel Core i3", "Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen"];

export function productMatchesRamFilter(specs: Record<string, unknown>, selected: string[]): boolean {
  if (!selected.length) return true;
  const ram = String(specs.ram ?? specs.RAM ?? "").toLowerCase();
  return selected.some((s) => ram.includes(s.replace("gb", "").trim()) || ram.includes(s.toLowerCase()));
}

export function productMatchesCpuFilter(specs: Record<string, unknown>, selected: string[]): boolean {
  if (!selected.length) return true;
  const t = JSON.stringify(specs).toLowerCase();
  return selected.some((s) => t.includes(s.toLowerCase().replace(/\s+/g, "")) || t.includes(s.toLowerCase()));
}

export { RAM_OPTS, CPU_OPTS };
