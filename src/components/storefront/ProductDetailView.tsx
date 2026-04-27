"use client";

import { BidModal } from "@/components/storefront/BidModal";
import { WatchButton } from "@/components/storefront/WatchButton";
import { GradeGuideDialog } from "@/components/storefront/GradeGuideDialog";
import { ProductPaymentChips } from "@/components/storefront/ProductPaymentChips";
import { ProductReviewsSection } from "@/components/storefront/ProductReviewsSection";
import { BTN } from "@/constants/design";
import { PAYMENT_OPTIONS, type PaymentOptionId } from "@/constants/payment-options";
import { isUsableImageSrc } from "@/lib/image-url";
import { gstBreakdown } from "@/lib/gst";
import { lotPayNowAmount } from "@/lib/lot-asas-checkout";
import { specsSummary, type PublicProductCard } from "@/lib/public-api";
import { ConditionBadge } from "@/components/ui/ConditionBadge";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { useCartStore } from "@/store/cart-store";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, Cpu, HelpCircle, Laptop, Minus, Plus, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const placeholder =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect fill="#0D1F3C" width="600" height="400"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94A3B8" font-size="20">Product</text></svg>`,
  );

type Listing = PublicProductCard["listings"][number] & { bestValue?: boolean };

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
  const [payOpt, setPayOpt] = useState<PaymentOptionId>("FULL");
  const addItem = useCartStore((s) => s.addItem);

  const listing = useMemo(
    () => initial.listings.find((l) => l.id === listingId) ?? initial.listings[0],
    [initial.listings, listingId],
  );

  const imgs = initial.images.length ? initial.images : [placeholder];
  const specEntries = Object.entries(initial.specs ?? {});

  const pricing = useMemo(() => {
    if (!listing) return null;
    const lineEx = listing.unitPrice * qty;
    return gstBreakdown(lineEx);
  }, [listing, qty]);

  const payNow = pricing ? lotPayNowAmount(pricing.total, payOpt) : 0;
  const balanceLater = pricing ? Math.round((pricing.total - payNow) * 100) / 100 : 0;

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

  const specTiles = [
    ["RAM", initial.specs.ram ?? initial.specs.RAM, Laptop],
    ["Storage", initial.specs.storage ?? initial.specs.Storage, Laptop],
    ["Processor", initial.specs.cpu ?? initial.specs.chip, Cpu],
  ] as const;

  return (
    <>
      <nav className="border-b border-border bg-white px-4 py-2 text-[11px] text-ink-muted">
        <div className="mx-auto max-w-7xl">
          <Link href="/products" className="hover:text-navy">
            Products
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/products?category=${initial.category.slug}`} className="hover:text-navy">
            {initial.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink-primary">{initial.name}</span>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:gap-8">
          <div className="min-w-0 space-y-6">
            <div className="rounded-xl bg-navy-light p-6">
              <div className="flex min-h-[220px] items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={isUsableImageSrc(imgs[activeImg]) ? imgs[activeImg]! : placeholder}
                  alt=""
                  className="max-h-[320px] w-full object-contain"
                />
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {imgs.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    className={`h-12 w-12 shrink-0 overflow-hidden rounded border bg-navy ${
                      activeImg === i ? "border-amber ring-1 ring-amber" : "border-white/10"
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
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{initial.brand}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-medium text-ink-primary">{initial.name}</h1>
                {initial.inspectorVerified ? <VerifiedBadge /> : null}
              </div>
              <p className="mt-2 text-sm text-ink-secondary">{specsSummary(initial.specs)}</p>
              <p
                className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  stockLabel === "In stock"
                    ? "bg-verified-bg text-verified-text"
                    : stockLabel === "Low stock"
                      ? "bg-amber-bg text-amber-dark"
                      : "bg-red-50 text-red-800"
                }`}
              >
                {stockLabel}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {specTiles.map(([label, val, Icon]) =>
                val != null && String(val).length > 0 ? (
                  <div key={label} className="rounded-lg border border-border bg-surface p-3">
                    <Icon className="h-4 w-4 text-ink-muted" aria-hidden />
                    <p className="mt-1 text-[10px] font-medium uppercase text-ink-muted">{label}</p>
                    <p className="text-[13px] font-medium text-ink-primary">{String(val)}</p>
                  </div>
                ) : null,
              )}
            </div>

            <div>
              <h2 className="text-[14px] font-medium text-ink-primary">Available options</h2>
              <p className="text-[12px] text-ink-muted">Choose a price tier (anonymised supply options)</p>
              <div className="mt-3 overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="bg-navy text-[10px] uppercase tracking-wide text-white">
                    <tr>
                      <th className="px-3 py-2.5">Option</th>
                      <th className="px-3 py-2.5">Condition</th>
                      <th className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1">
                          Performance
                          <span
                            title="Supplier performance score from delivery, fulfilment, and reviews. Supplier identity stays private."
                            className="inline-flex"
                          >
                            <HelpCircle className="h-3 w-3 opacity-80" aria-hidden />
                          </span>
                        </span>
                      </th>
                      <th className="px-3 py-2.5">Stock</th>
                      <th className="px-3 py-2.5">MOQ</th>
                      <th className="px-3 py-2.5">Price</th>
                      <th className="px-3 py-2.5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light bg-card">
                    {initial.listings.map((l) => {
                      const sel = listingId === l.id;
                      return (
                        <tr
                          key={l.id}
                          className={sel ? "bg-lot-bg/40" : "hover:bg-surface"}
                        >
                          <td className="px-3 py-2.5 font-medium text-ink-primary">
                            {l.label}
                            {l.bestValue ? (
                              <span className="ml-1 rounded bg-verified-bg px-1.5 py-0.5 text-[9px] font-medium text-verified-text">
                                Best value
                              </span>
                            ) : null}
                          </td>
                          <td className="px-3 py-2.5">
                            <ConditionBadge condition={l.condition} size="sm" />
                          </td>
                          <td className="px-3 py-2.5 text-[12px] text-ink-secondary">
                            {l.performanceScore != null ? (
                              <span
                                title={l.scoreLabel}
                                className="font-medium text-ink-primary tabular-nums"
                              >
                                {l.performanceScore}
                                <span className="ml-1 text-[10px] font-normal text-ink-muted">
                                  · {l.scoreLabel}
                                </span>
                              </span>
                            ) : (
                              <span title={l.scoreLabel ?? "New or unrated supplier"} className="text-ink-muted">
                                {l.scoreLabel ?? "—"}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-ink-secondary">{l.stockQty}</td>
                          <td className="px-3 py-2.5 text-ink-secondary">{l.minOrderQty}</td>
                          <td className="px-3 py-2.5 text-[14px] font-medium text-ink-primary">
                            ₹{l.unitPrice.toLocaleString("en-IN")}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              <button
                                type="button"
                                className={cnButton(sel)}
                                onClick={() => {
                                  setListingId(l.id);
                                  setQty(l.minOrderQty);
                                }}
                              >
                                {sel ? "Selected" : "Select"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <GradeGuideDialog />
                <p className="text-xs font-medium text-verified-text">✓ All conditions certified by Rentfoxxy</p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-border bg-amber-bg p-4">
              <h3 className="text-[13px] font-medium text-amber-dark">Want a better price?</h3>
              <p className="mt-1 text-[12px] text-amber-dark/80">
                Submit a structured bid — vendors respond with a counter or approval without exposing their identity
                upfront.
              </p>
              <button type="button" className={`${BTN.primary} mt-3 w-full`} onClick={() => setBidOpen(true)}>
                Request Custom Price
              </button>
            </div>

            <WatchButton
              productId={initial.id}
              productSlug={initial.slug}
              currentMinPrice={initial.priceMin}
            />
            <ProductPaymentChips slug={initial.slug} />

            <Accordion.Root type="single" collapsible className="overflow-hidden rounded-xl border border-border bg-card">
              <Accordion.Item value="specs">
                <Accordion.Header>
                  <Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3 text-left text-[13px] font-medium text-ink-primary hover:bg-surface">
                    Full specifications
                    <ChevronDown className="h-4 w-4 shrink-0 transition group-data-[state=open]:rotate-180" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="border-t border-border-light px-4 pb-4">
                  <dl className="mt-3 space-y-2 text-[12px]">
                    {specEntries.map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 border-b border-border-light py-2 last:border-0">
                        <dt className="text-[11px] capitalize text-ink-muted">{k}</dt>
                        <dd className="text-ink-secondary">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </Accordion.Content>
              </Accordion.Item>
            </Accordion.Root>
          </div>

          <aside className="h-fit space-y-4 lg:sticky lg:top-[58px]">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] text-ink-muted">Selected: {listing?.label ?? "—"}</p>
              {listing ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <ConditionBadge condition={listing.condition} size="sm" />
                  <span className="text-xl font-medium text-ink-primary">
                    ₹{listing.unitPrice.toLocaleString("en-IN")}
                    <span className="text-[11px] font-normal text-ink-muted"> / unit (ex-GST)</span>
                  </span>
                </div>
              ) : null}

              {listing ? (
                <>
                  <p className="mb-2 mt-4 text-[11px] font-medium text-ink-primary">Quantity</p>
                  <div className="flex overflow-hidden rounded-lg border border-border">
                    <button
                      type="button"
                      className="border-r border-border px-3 py-2 text-ink-secondary hover:bg-surface"
                      onClick={() => setQty((q) => Math.max(listing.minOrderQty, q - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="flex flex-1 items-center justify-center text-lg font-semibold text-ink-primary">
                      {qty}
                    </span>
                    <button
                      type="button"
                      className="border-l border-border px-3 py-2 text-ink-secondary hover:bg-surface"
                      onClick={() => setQty((q) => Math.min(listing.stockQty, q + 1))}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : null}

              <p className="mb-2 mt-4 text-[11px] font-medium text-ink-primary">Payment</p>
              <div className="space-y-2">
                {PAYMENT_OPTIONS.map((opt) => {
                  const sel = payOpt === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPayOpt(opt.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition ${
                        sel ? "border-navy bg-surface ring-1 ring-navy/20" : "border-border hover:bg-surface"
                      }`}
                    >
                      <p className="font-semibold text-ink-primary">{opt.label}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">{opt.subtitle}</p>
                    </button>
                  );
                })}
              </div>

              {pricing ? (
                <div className="mt-4 space-y-1.5 rounded-lg bg-surface p-3 text-[12px]">
                  <div className="flex justify-between text-ink-secondary">
                    <span>Subtotal (ex-GST)</span>
                    <span>₹{pricing.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-ink-secondary">
                    <span>GST 18%</span>
                    <span>₹{pricing.gstAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between border-t border-border-light pt-2 font-semibold text-ink-primary">
                    <span>Grand total</span>
                    <span>₹{pricing.total.toLocaleString("en-IN")}</span>
                  </div>
                  {payOpt === "TOKEN_5" ? (
                    <div className="mt-2 rounded-lg border border-amber-border bg-amber-bg p-2 text-[11px] text-amber-dark">
                      <div className="flex justify-between font-medium">
                        <span>Pay now</span>
                        <span>₹{payNow.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="mt-1 flex justify-between text-ink-muted">
                        <span>Balance</span>
                        <span>₹{balanceLater.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={addToCart}
                  disabled={!listing}
                  className={`${BTN.navy} flex w-full items-center justify-center gap-2 py-3`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </button>
                <button
                  type="button"
                  onClick={() => setBidOpen(true)}
                  disabled={!listing}
                  className={`${BTN.bid} w-full py-2.5 text-center`}
                >
                  Bid for Custom Price
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border-light pt-3 text-[10px] text-ink-muted">
                {["🛡️ Verified", "📄 GST Invoice", "🔒 Secure Payment"].map((t) => (
                  <span key={t} className="rounded bg-surface px-2 py-1">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <ProductReviewsSection slug={initial.slug} />
      </div>

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
    </>
  );
}

function cnButton(active: boolean) {
  return `rounded border px-2 py-1 text-[10px] font-medium ${
    active ? "border-navy bg-navy text-white" : "border-border text-ink-secondary hover:border-navy/40"
  }`;
}
