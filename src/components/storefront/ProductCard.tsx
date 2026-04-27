"use client";

import { CompareButton } from "@/components/storefront/CompareButton";
import { BTN } from "@/constants/design";
import { isUsableImageSrc } from "@/lib/image-url";
import { specsSummary, type PublicProductCard } from "@/lib/public-api";
import { useCartStore } from "@/store/cart-store";
import { ConditionBadge } from "@/components/ui/ConditionBadge";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { cn } from "@/lib/utils";
import { LayoutGrid, List, ShoppingCart } from "lucide-react";
import Link from "next/link";

const placeholder =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#0D1F3C" width="400" height="300"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94A3B8" font-family="system-ui" font-size="28">💻</text></svg>`,
  );

function specChips(specs: Record<string, unknown>): string[] {
  const ram = specs.ram ?? specs.RAM;
  const storage = specs.storage ?? specs.Storage;
  const cpu = specs.cpu ?? specs.chip ?? specs.CPU ?? specs.Processor;
  return [cpu, ram, storage].filter(Boolean).map(String);
}

export function ProductCard({
  product,
  listMode = false,
  showCartAction = true,
}: {
  product: PublicProductCard;
  listMode?: boolean;
  /** P3 homepage cards omit the cart action. */
  showCartAction?: boolean;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const img = product.images[0] || placeholder;
  const fromPrice = product.priceMin;
  const chips = specChips(product.specs);
  const first = product.listings[0];
  const lowStock = product.totalStock > 0 && product.totalStock < 10;

  function addDefaultToCart() {
    if (!first) return;
    addItem({
      listingId: first.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      image: product.images[0] || placeholder,
      optionLabel: first.label,
      unitPrice: first.unitPrice,
      minOrderQty: first.minOrderQty,
      maxQty: first.stockQty,
      quantity: first.minOrderQty,
    });
  }

  const summaryLine = specsSummary(product.specs);

  const imageBlock = (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "relative flex min-h-[90px] items-center justify-center bg-navy-light p-4",
        listMode ? "h-28 w-36 shrink-0 rounded-lg" : "block w-full",
      )}
    >
      {first ? (
        <div className="absolute left-2 top-2 z-10">
          <ConditionBadge condition={first.condition} size="sm" />
        </div>
      ) : null}
      {product.inspectorVerified ? (
        <div className="absolute right-2 top-2 z-10">
          <VerifiedBadge size="sm" />
        </div>
      ) : null}
      {lowStock ? (
        <span className="absolute bottom-2 right-2 z-10 rounded bg-red-500/15 px-1.5 py-0.5 text-[9px] text-red-300">
          Low stock: {product.totalStock}
        </span>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={isUsableImageSrc(img) ? img : placeholder}
        alt=""
        className="max-h-[100px] w-full object-contain"
      />
    </Link>
  );

  const actions = (
    <div className="flex flex-wrap gap-1">
      <CompareButton product={product} />
      <Link href={`/products/${product.slug}`} className={cn(BTN.bid, "px-2 py-1.5 text-[10px]")}>
        Bid
      </Link>
      <Link
        href={`/products/${product.slug}`}
        className="rounded bg-navy px-3 py-1.5 text-[10px] text-white transition-colors hover:bg-navy-light"
      >
        View →
      </Link>
      {showCartAction && first ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            addDefaultToCart();
          }}
          className="inline-flex items-center justify-center rounded-lg border border-border px-2 py-1.5 text-ink-secondary transition hover:bg-surface"
          aria-label="Add to cart"
        >
          <ShoppingCart className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );

  if (listMode) {
    return (
      <div className="group relative flex gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-navy/30 hover:shadow-md">
        {imageBlock}
        <div className="flex min-w-0 flex-1 flex-col py-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">{product.brand}</p>
          <Link href={`/products/${product.slug}`} className="mt-0.5 line-clamp-2 text-[13px] font-medium text-ink-primary hover:text-navy">
            {product.name}
          </Link>
          <p className="mt-1 line-clamp-2 text-[11px] text-ink-muted">{summaryLine}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {chips.slice(0, 4).map((c) => (
              <span key={c} className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-ink-secondary">
                {c}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-ink-muted">
            {product.optionCount} options · From ₹{fromPrice.toLocaleString("en-IN")}
          </p>
          <div className="mt-auto flex flex-wrap items-end justify-between gap-2 border-t border-border-light pt-3">
            <div>
              <p className="text-[16px] font-medium text-ink-primary">₹{fromPrice.toLocaleString("en-IN")}</p>
              <p className="text-[9px] text-ink-muted">per unit</p>
            </div>
            {actions}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:border-navy/30 hover:shadow-md">
      {imageBlock}
      <div className="flex flex-1 flex-col px-3 py-3">
        <p className="text-[10px] uppercase tracking-wide text-ink-muted">{product.brand}</p>
        <Link href={`/products/${product.slug}`} className="mt-0.5 line-clamp-2 text-[13px] font-medium text-ink-primary hover:text-navy">
          {product.name}
        </Link>
        <div className="mt-2 flex flex-wrap gap-1">
          {chips.slice(0, 4).map((c) => (
            <span key={c} className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-ink-secondary">
              {c}
            </span>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-ink-muted">
          {product.optionCount} options · From ₹{fromPrice.toLocaleString("en-IN")}
        </p>
        <div className="mt-2 border-t border-border-light pt-2">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[16px] font-medium text-ink-primary">₹{fromPrice.toLocaleString("en-IN")}</p>
              <p className="text-[9px] text-ink-muted">per unit</p>
            </div>
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ViewModeToggle({
  mode,
  setMode,
}: {
  mode: "grid" | "list";
  setMode: (m: "grid" | "list") => void;
}) {
  return (
    <div className="flex rounded-lg border border-border p-0.5">
      <button
        type="button"
        className={`rounded-md p-2 ${mode === "grid" ? "bg-navy text-white" : "text-ink-muted"}`}
        onClick={() => setMode("grid")}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={`rounded-md p-2 ${mode === "list" ? "bg-navy text-white" : "text-ink-muted"}`}
        onClick={() => setMode("list")}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
