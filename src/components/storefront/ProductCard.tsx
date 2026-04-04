"use client";

import { isUsableImageSrc } from "@/lib/image-url";
import { gradeBadge, specsSummary, type PublicProductCard } from "@/lib/public-api";
import { useCartStore } from "@/store/cart-store";
import { LayoutGrid, List, ShoppingCart } from "lucide-react";
import Link from "next/link";

const placeholder =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#EEF2FF" width="400" height="300"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748B" font-family="system-ui" font-size="18">Product</text></svg>`,
  );

export function ProductCard({
  product,
  listMode = false,
}: {
  product: PublicProductCard;
  listMode?: boolean;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const img = product.images[0] || placeholder;
  const fromPrice = product.priceMin;
  const summary = specsSummary(product.specs);
  const first = product.listings[0];
  const condBadge = first ? gradeBadge(first.condition) : null;
  const multiCond = (product.distinctConditions?.length ?? 0) > 1;

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

  return (
    <div
      className={`group relative flex rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-accent hover:shadow-md ${
        listMode ? "flex-row gap-4 p-4" : "flex-col overflow-hidden"
      }`}
    >
      {product.isFeatured && (
        <span className="absolute left-3 top-3 z-10 rounded bg-fox px-2 py-0.5 text-xs font-bold text-slate-900">
          Featured
        </span>
      )}
      {condBadge ? (
        <span
          className="absolute right-3 top-3 z-10 max-w-[10rem] truncate rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow sm:text-xs"
          style={{ backgroundColor: condBadge.color }}
          title={`${condBadge.dot} ${condBadge.label}`}
        >
          {condBadge.dot} {condBadge.label}
        </span>
      ) : null}
      <Link
        href={`/products/${product.slug}`}
        className={listMode ? "relative h-28 w-36 shrink-0 overflow-hidden rounded-lg bg-surface" : "relative block aspect-[4/3] bg-surface"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={isUsableImageSrc(img) ? img : placeholder}
          alt=""
          className="h-full w-full object-cover"
        />
      </Link>
      <div className={`flex flex-1 flex-col p-4 ${listMode ? "py-2" : ""}`}>
        <p className="text-xs font-medium uppercase tracking-wide text-accent">{product.brand}</p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-1 font-semibold text-slate-900 line-clamp-2 hover:text-accent">
            {product.name}
          </h3>
        </Link>
        <p className="mt-2 text-xs text-muted line-clamp-2">{summary}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-lg font-bold text-primary">
            From ₹{fromPrice.toLocaleString("en-IN")}
            {product.priceMax !== product.priceMin && (
              <span className="text-sm font-normal text-muted">
                {" "}
                – ₹{product.priceMax.toLocaleString("en-IN")}
              </span>
            )}
          </span>
          <span className="rounded-full bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
            {product.optionCount} options
          </span>
        </div>
        {multiCond ? (
          <p className="mt-1 text-xs font-medium text-slate-600">Multiple conditions available</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:border-accent hover:text-accent sm:flex-none"
          >
            View details
          </Link>
          <button
            type="button"
            onClick={addDefaultToCart}
            disabled={!first}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-light disabled:opacity-50 sm:flex-none"
          >
            <ShoppingCart className="h-4 w-4" />
            Add to cart
          </button>
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
    <div className="flex rounded-lg border border-slate-200 p-0.5">
      <button
        type="button"
        className={`rounded-md p-2 ${mode === "grid" ? "bg-accent-light text-accent" : "text-muted"}`}
        onClick={() => setMode("grid")}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={`rounded-md p-2 ${mode === "list" ? "bg-accent-light text-accent" : "text-muted"}`}
        onClick={() => setMode("list")}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
