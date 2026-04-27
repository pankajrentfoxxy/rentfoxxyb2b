import type { PublicProductCard } from "@/lib/public-api";
import type { ProductCondition } from "@prisma/client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CompareItem {
  id: string;
  name: string;
  slug: string;
  brand: string;
  specs: Record<string, string>;
  minPrice: number;
  condition: ProductCondition | string;
  images: string[];
}

type CompareState = {
  items: CompareItem[];
  addItem: (item: CompareItem) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
};

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        if (get().items.length >= 5) return;
        if (get().items.some((i) => i.id === item.id)) return;
        set((s) => ({ items: [...s.items, item] }));
      },
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clearAll: () => set({ items: [] }),
    }),
    { name: "rentfoxxy-compare" },
  ),
);

export function productToCompareItem(p: PublicProductCard): CompareItem {
  const first = p.listings[0];
  const specs: Record<string, string> = {};
  for (const [k, v] of Object.entries(p.specs ?? {})) {
    if (v != null) specs[k] = String(v);
  }
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    specs,
    minPrice: p.priceMin,
    condition: first?.condition ?? "BRAND_NEW",
    images: p.images,
  };
}
