"use client";

import { BidModal } from "@/components/storefront/BidModal";
import { GradeGuideDialog } from "@/components/storefront/GradeGuideDialog";
import { ProductPaymentChips } from "@/components/storefront/ProductPaymentChips";
import { ProductReviewsSection } from "@/components/storefront/ProductReviewsSection";
import { isUsableImageSrc } from "@/lib/image-url";
import { gradeBadge, specsSummary, type PublicProductCard } from "@/lib/public-api";
import { useCartStore } from "@/store/cart-store";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, Minus, Plus, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const placeholder =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect fill="#EEF2FF" width="600" height="400"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748B" font-size="20">Product</text></svg>`,
  );

type Listing = PublicProductCard["listings"][number] & { bestValue?: boolean };

function warrantyCell(l: Listing) {
  if (l.condition === "BRAND_NEW") return "—";
  const t = l.warrantyType ?? "—";
  if (!l.warrantyMonths) return t;
  return `${l.warrantyMonths} mo · ${t}`;
}

type ProductDetailInitial = Omit<PublicProductCard, "listings"> & { listings: Listing[] };

export function ProductDetailView({
  initial,
}: {
  initial: ProductDetailInitial;
}) {
  const [activeImg, setActiveImg] = useState(0);
  const [listingId, setListingId] = useState(initial.listings[0]?.id ?? "");
  const [qty, setQty] = useState(initial.listings[0]?.minOrderQty ?? 1);
  const [bidOpen, setBidOpen] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const listing = useMemo(
    () => initial.listings.find((l) => l.id === listingId) ?? initial.listings[0],
    [initial.listings, listingId],
  );

  const imgs = initial.images.length ? initial.images : [placeholder];
  const specEntries = Object.entries(initial.specs ?? {});

  function addToCart() {
    if (!listing) return;
    addItem({
      listingId: listing.id,
      productId: initial.id,
      productSlug: initial.slug,
      productName: initial.name,
      image: imgs[0] || placeholder,
      optionLabel: listing.label,
      unitPrice: listing.unitPrice,
      minOrderQty: listing.minOrderQty,
      maxQty: listing.stockQty,
      quantity: qty,
    });
  }

  const stockLabel =
    initial.totalStock <= 0
      ? "Out of stock"
      : initial.totalStock < 10
        ? "Low stock"
        : "In stock";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-muted">
        <Link href="/products" className="hover:text-accent">
          Products
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/products?category=${initial.category.slug}`} className="hover:text-accent">
          {initial.category.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">{initial.name}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={isUsableImageSrc(imgs[activeImg]) ? imgs[activeImg]! : placeholder}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
            />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {imgs.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveImg(i)}
                className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                  activeImg === i ? "border-accent" : "border-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={isUsableImageSrc(src) ? src : placeholder}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="rounded-full bg-accent-light px-3 py-1 text-xs font-semibold text-accent">
            {initial.brand}
          </span>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">{initial.name}</h1>
          <p className="mt-2 text-muted">{specsSummary(initial.specs)}</p>
          <p
            className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              stockLabel === "In stock"
                ? "bg-emerald-100 text-emerald-800"
                : stockLabel === "Low stock"
                  ? "bg-amber-100 text-amber-900"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {stockLabel}
          </p>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">Available options</h2>
            <p className="text-sm text-muted">Choose a price tier (anonymised supply options)</p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-surface text-xs uppercase text-muted">
                  <tr>
                    <th className="px-3 py-2">Option</th>
                    <th className="px-3 py-2">Condition</th>
                    <th className="px-3 py-2">Battery</th>
                    <th className="px-3 py-2">Warranty</th>
                    <th className="px-3 py-2">Price</th>
                    <th className="px-3 py-2">Stock</th>
                    <th className="px-3 py-2">MOQ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {initial.listings.map((l) => {
                    const g = gradeBadge(l.condition);
                    const sel = listingId === l.id;
                    return (
                      <tr
                        key={l.id}
                        className={`cursor-pointer hover:bg-surface/80 ${sel ? "bg-accent-light/40" : ""}`}
                        onClick={() => {
                          setListingId(l.id);
                          setQty(l.minOrderQty);
                        }}
                      >
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {l.label}
                          {l.bestValue ? (
                            <span className="ml-1 text-xs font-semibold text-emerald-600">Best value</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                            style={{ backgroundColor: g.color }}
                          >
                            {g.dot} {g.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-muted">
                          {l.condition === "BRAND_NEW" ? "—" : l.batteryHealth != null ? `${l.batteryHealth}%` : "—"}
                        </td>
                        <td className="px-3 py-2 text-muted">{warrantyCell(l)}</td>
                        <td className="px-3 py-2 font-bold text-primary">
                          ₹{l.unitPrice.toLocaleString("en-IN")}
                        </td>
                        <td className="px-3 py-2">{l.stockQty}</td>
                        <td className="px-3 py-2">{l.minOrderQty}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <GradeGuideDialog />
              <p className="text-xs font-medium text-emerald-800">
                ✓ All conditions certified by Rentfoxxy
              </p>
            </div>
            {listing?.condition === "REFURB_C" ? (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <strong>Sold as-is:</strong> Grade C items are cosmetically worn but functional. Warranty may be
                limited — see option details.
              </p>
            ) : null}
          </div>

          {listing && (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-lg border">
                <button
                  type="button"
                  className="p-3 hover:bg-surface"
                  onClick={() => setQty((q) => Math.max(listing.minOrderQty, q - 1))}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[3rem] text-center font-semibold">{qty}</span>
                <button
                  type="button"
                  className="p-3 hover:bg-surface"
                  onClick={() => setQty((q) => Math.min(listing.stockQty, q + 1))}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={addToCart}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-light"
              >
                <ShoppingCart className="h-5 w-5" />
                Add to cart
              </button>
              <button
                type="button"
                onClick={() => setBidOpen(true)}
                className="inline-flex flex-1 items-center justify-center rounded-lg border-2 border-primary px-6 py-3 font-semibold text-primary hover:bg-surface"
              >
                Request custom price
              </button>
            </div>
          )}

          <ProductPaymentChips slug={initial.slug} />

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {(
              [
                ["RAM", initial.specs.ram ?? initial.specs.RAM],
                ["Storage", initial.specs.storage ?? initial.specs.Storage],
                ["Processor", initial.specs.cpu ?? initial.specs.chip],
                ["Display", initial.specs.display ?? initial.specs.Display],
                ["OS", initial.specs.os],
                ["Weight", initial.specs.weight],
              ] as [string, unknown][]
            ).map(([k, v]) =>
              v != null && String(v).length > 0 ? (
                <div key={k} className="rounded-lg border bg-surface px-3 py-2 text-sm">
                  <p className="text-xs font-medium uppercase text-muted">{k}</p>
                  <p className="font-medium text-slate-900">{String(v)}</p>
                </div>
              ) : null,
            )}
          </div>

          <Accordion.Root type="single" collapsible className="mt-10 space-y-2">
            <Accordion.Item value="specs" className="overflow-hidden rounded-xl border">
              <Accordion.Header>
                <Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold hover:bg-surface">
                  Full specifications
                  <ChevronDown className="h-4 w-4 transition group-data-[state=open]:rotate-180" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="border-t bg-white px-4 pb-4">
                <dl className="mt-4 grid gap-2 text-sm">
                  {specEntries.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-slate-50 py-2">
                      <dt className="text-muted capitalize">{k}</dt>
                      <dd className="font-medium text-slate-800">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion.Root>
        </div>
      </div>

      <ProductReviewsSection slug={initial.slug} />

      <BidModal
        open={bidOpen}
        onClose={() => setBidOpen(false)}
        productName={initial.name}
        productSlug={initial.slug}
        listing={
          listing
            ? {
                id: listing.id,
                label: listing.label,
                unitPrice: listing.unitPrice,
                stockQty: listing.stockQty,
                minOrderQty: listing.minOrderQty,
              }
            : null
        }
      />
    </div>
  );
}
