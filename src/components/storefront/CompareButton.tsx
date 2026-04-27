"use client";

import { productToCompareItem, useCompareStore, type CompareItem } from "@/store/compareStore";
import type { PublicProductCard } from "@/lib/public-api";
import { BarChart2 } from "lucide-react";

export function CompareButton({
  product,
  item,
}: {
  product?: PublicProductCard;
  item?: CompareItem;
}) {
  const resolved = item ?? (product ? productToCompareItem(product) : null);
  const { items, addItem, removeItem } = useCompareStore();
  if (!resolved) return null;

  const isComparing = items.some((i) => i.id === resolved.id);
  const isFull = items.length >= 5 && !isComparing;

  return (
    <button
      type="button"
      onClick={() => (isComparing ? removeItem(resolved.id) : addItem(resolved))}
      disabled={isFull}
      title={isFull ? "Remove a product to add another" : "Add to compare"}
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium transition-all ${
        isComparing
          ? "border-lot-border bg-lot-bg text-lot-text"
          : isFull
            ? "cursor-not-allowed border-border text-ink-muted opacity-40"
            : "border-border text-ink-muted hover:border-lot hover:text-lot"
      }`}
    >
      <BarChart2 size={11} />
      {isComparing ? "Added ✓" : "Compare"}
    </button>
  );
}
