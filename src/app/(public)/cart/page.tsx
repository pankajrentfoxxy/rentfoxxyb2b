"use client";

import { EmptyState } from "@/components/shared/EmptyState";
import { gstBreakdown } from "@/lib/gst";
import { isUsableImageSrc } from "@/lib/image-url";
import { useCartStore } from "@/store/cart-store";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";

const ph =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="#EEF2FF" width="80" height="80"/></svg>`,
  );

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const sub = useCartStore((s) => s.subtotal());
  const gst = gstBreakdown(sub);

  if (!items.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse the catalog and add lines for checkout."
          cta={{ label: "Browse products", href: "/products" }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((line) => (
            <div
              key={line.listingId}
              className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={isUsableImageSrc(line.image) ? line.image : ph}
                alt=""
                className="h-24 w-28 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${line.productSlug}`}
                  className="font-semibold text-slate-900 hover:text-accent"
                >
                  {line.productName}
                </Link>
                <p className="text-xs text-muted">{line.optionLabel}</p>
                <p className="mt-2 text-sm">
                  ₹{line.unitPrice.toLocaleString("en-IN")} × {line.quantity}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center rounded-lg border">
                    <button
                      type="button"
                      className="p-2 hover:bg-surface"
                      onClick={() => updateQty(line.listingId, line.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{line.quantity}</span>
                    <button
                      type="button"
                      className="p-2 hover:bg-surface"
                      onClick={() => updateQty(line.listingId, line.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(line.listingId)}
                    className="inline-flex items-center gap-1 text-sm text-danger hover:underline"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                  <span className="text-sm text-muted">Save for later — coming soon</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">
                  ₹{(line.unitPrice * line.quantity).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>₹{gst.subtotal.toLocaleString("en-IN")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">GST (18%)</dt>
              <dd>₹{gst.gstAmount.toLocaleString("en-IN")}</dd>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <dt>Total</dt>
              <dd>₹{gst.total.toLocaleString("en-IN")}</dd>
            </div>
          </dl>
          <input
            type="text"
            placeholder="Coupon code"
            disabled
            className="mt-4 w-full rounded-lg border border-dashed border-slate-200 bg-surface px-3 py-2 text-sm text-muted"
          />
          <Link
            href="/checkout"
            className="mt-6 flex h-11 w-full items-center justify-center rounded-lg bg-primary font-semibold text-white hover:bg-primary-light"
          >
            Proceed to checkout
          </Link>
          <Link
            href="/products"
            className="mt-3 block text-center text-sm font-medium text-accent hover:underline"
          >
            Request bulk price (bids)
          </Link>
          <p className="mt-6 text-center text-xs text-muted">UPI · Cards · NetBanking via Razorpay</p>
        </div>
      </div>
    </div>
  );
}
