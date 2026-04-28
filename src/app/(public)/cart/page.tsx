"use client";

import { EmptyState } from "@/components/shared/EmptyState";
import { gstBreakdown } from "@/lib/gst";
import { isUsableImageSrc } from "@/lib/image-url";
import { useCartStore } from "@/store/cart-store";
import { Minus, Plus, ShoppingBag, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

const ph =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="#EEF2FF" width="80" height="80"/></svg>`,
  );

type PoLine = {
  description: string;
  quantity: number;
  sku: string | null;
  matchedProduct: {
    id: string;
    name: string;
    slug: string;
    listingId: string;
    unitPrice: number;
    minOrderQty: number;
    stockQty: number;
  } | null;
};

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const addItem = useCartStore((s) => s.addItem);
  const sub = useCartStore((s) => s.subtotal());
  const gst = gstBreakdown(sub);
  const poInputRef = useRef<HTMLInputElement>(null);
  const [poBusy, setPoBusy] = useState(false);
  const [poError, setPoError] = useState<string | null>(null);
  const [poData, setPoData] = useState<{
    poNumber: string | null;
    companyName: string | null;
    lines: PoLine[];
  } | null>(null);

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

  async function onPoSelected(file: File | undefined) {
    if (!file) return;
    setPoBusy(true);
    setPoError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/customer/parse-po", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) {
        setPoError(typeof j.error === "string" ? j.error : "Upload failed");
        return;
      }
      setPoData({
        poNumber: j.poNumber ?? null,
        companyName: j.companyName ?? null,
        lines: Array.isArray(j.lines) ? j.lines : [],
      });
    } finally {
      setPoBusy(false);
    }
  }

  function addPoLineToCart(line: PoLine) {
    const m = line.matchedProduct;
    if (!m) return;
    const qty = Math.min(
      Math.max(line.quantity, m.minOrderQty),
      Math.max(m.minOrderQty, m.stockQty),
    );
    addItem({
      listingId: m.listingId,
      productId: m.id,
      productSlug: m.slug,
      productName: m.name,
      image: ph,
      optionLabel: "PO match",
      unitPrice: m.unitPrice,
      minOrderQty: m.minOrderQty,
      maxQty: m.stockQty,
      quantity: qty,
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Cart</h1>

      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-800">Upload company PO (PDF, TXT, CSV, or Excel)</p>
        <p className="mt-1 text-xs text-muted">
          We&apos;ll extract line items and suggest catalog matches. Requires sign-in as a customer and{" "}
          <code className="rounded bg-white px-1">GEMINI_API_KEY</code>.
        </p>
        <input
          ref={poInputRef}
          type="file"
          accept=".pdf,.txt,.csv,.xlsx,.xls,application/pdf,text/plain,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="hidden"
          onChange={(e) => void onPoSelected(e.target.files?.[0])}
        />
        <button
          type="button"
          disabled={poBusy}
          onClick={() => poInputRef.current?.click()}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {poBusy ? "Parsing…" : "Upload PO"}
        </button>
        {poError ? <p className="mt-2 text-sm text-red-700">{poError}</p> : null}
      </div>

      {poData ? (
        <div className="mt-6 rounded-xl border border-teal-200 bg-teal-50/50 p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">PO parsed — review matches</h2>
              <p className="text-xs text-muted">
                {poData.companyName ? `${poData.companyName} · ` : ""}
                {poData.poNumber ? `PO #${poData.poNumber}` : ""}
              </p>
            </div>
            <button
              type="button"
              className="text-sm text-muted hover:text-red-600"
              onClick={() => setPoData(null)}
            >
              Clear PO
            </button>
          </div>
          <ul className="mt-4 space-y-3">
            {poData.lines.map((line, i) => (
              <li key={i} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                <p className="font-medium text-slate-900">PO line {i + 1}</p>
                <p className="text-muted">{line.description}</p>
                <p className="mt-1 text-xs">Qty requested: {line.quantity}</p>
                {line.matchedProduct ? (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
                    <span>
                      Match: <strong>{line.matchedProduct.name}</strong> @ ₹
                      {line.matchedProduct.unitPrice.toLocaleString("en-IN")}
                    </span>
                    <button
                      type="button"
                      onClick={() => addPoLineToCart(line)}
                      className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Add to cart
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-amber-800">No confident catalog match — search manually.</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
