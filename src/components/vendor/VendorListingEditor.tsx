"use client";

import { GRADE_CONFIG, GRADE_ORDER } from "@/constants/grading";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Accordion from "@radix-ui/react-accordion";
import * as Slider from "@radix-ui/react-slider";
import type { ProductCondition } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";

type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string;
};

export function VendorListingEditor({
  mode,
  listingId,
  initial,
}: {
  mode: "create" | "edit";
  listingId?: string;
  initial?: {
    product: { name: string; slug: string; brand: string };
    sku: string;
    unitPrice: number;
    minBidPrice: number;
    stockQty: number;
    minOrderQty: number;
    bulkPricing: unknown;
    condition?: ProductCondition;
    batteryHealth?: number | null;
    conditionNotes?: string | null;
    warrantyMonths?: number;
    warrantyType?: string | null;
    refurbImages?: string[];
    requiresAdminApproval?: boolean;
    isActive?: boolean;
  };
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [unitPrice, setUnitPrice] = useState(String(initial?.unitPrice ?? ""));
  const [minBidPrice, setMinBidPrice] = useState(String(initial?.minBidPrice ?? ""));
  const [stockQty, setStockQty] = useState(String(initial?.stockQty ?? "0"));
  const [minOrderQty, setMinOrderQty] = useState(String(initial?.minOrderQty ?? "1"));
  const [bulkJson, setBulkJson] = useState(
    initial?.bulkPricing != null ? JSON.stringify(initial.bulkPricing, null, 2) : "",
  );
  const [condition, setCondition] = useState<ProductCondition>(initial?.condition ?? "BRAND_NEW");
  const [batteryHealth, setBatteryHealth] = useState(
    initial?.batteryHealth != null ? initial.batteryHealth : 85,
  );
  const [warrantyType, setWarrantyType] = useState(initial?.warrantyType ?? "Rentfoxxy-backed");
  const [warrantyMonths, setWarrantyMonths] = useState(String(initial?.warrantyMonths ?? 6));
  const [conditionNotes, setConditionNotes] = useState(initial?.conditionNotes ?? "");
  const [refurbUrl1, setRefurbUrl1] = useState(initial?.refurbImages?.[0] ?? "");
  const [refurbUrl2, setRefurbUrl2] = useState(initial?.refurbImages?.[1] ?? "");
  const [refurbUrl3, setRefurbUrl3] = useState(initial?.refurbImages?.[2] ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const search = useCallback(async (term: string) => {
    const res = await fetch(`/api/vendor/catalog-products?q=${encodeURIComponent(term)}&limit=30`);
    if (!res.ok) return;
    const data = (await res.json()) as { products: CatalogProduct[] };
    setCatalog(data.products ?? []);
  }, []);

  useEffect(() => {
    if (mode !== "create") return;
    const t = setTimeout(() => search(q), 250);
    return () => clearTimeout(t);
  }, [q, mode, search]);

  function refurbImagesPayload(): string[] {
    return [refurbUrl1, refurbUrl2, refurbUrl3].map((u) => u.trim()).filter(Boolean).slice(0, 3);
  }

  function conditionPayload() {
    const base = { condition };
    if (condition === "BRAND_NEW") return base;
    return {
      ...base,
      batteryHealth,
      warrantyType,
      warrantyMonths: Math.min(24, Math.max(0, Number(warrantyMonths) || 0)),
      conditionNotes: conditionNotes.slice(0, 200),
      refurbImages: refurbImagesPayload(),
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      let bulkPricing: unknown = undefined;
      if (bulkJson.trim()) {
        try {
          bulkPricing = JSON.parse(bulkJson) as unknown;
        } catch {
          setErr("Bulk pricing must be valid JSON.");
          return;
        }
      }

      if (mode === "create") {
        if (!selectedProduct) {
          setErr("Select a catalog product.");
          return;
        }
        const res = await fetch("/api/vendor/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: selectedProduct.id,
            sku: sku.trim() || undefined,
            unitPrice: Number(unitPrice),
            minBidPrice: Number(minBidPrice),
            stockQty: Number(stockQty),
            minOrderQty: Number(minOrderQty),
            bulkPricing: bulkJson.trim() ? bulkPricing : undefined,
            ...conditionPayload(),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErr(data.error ?? "Failed");
          return;
        }
        router.push(`/vendor/products/${data.listing.id}/edit`);
        router.refresh();
        return;
      }

      const res = await fetch(`/api/vendor/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: sku.trim(),
          unitPrice: Number(unitPrice),
          minBidPrice: Number(minBidPrice),
          stockQty: Number(stockQty),
          minOrderQty: Number(minOrderQty),
          bulkPricing: bulkJson.trim() ? bulkPricing : null,
          ...conditionPayload(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Failed");
        return;
      }
      router.refresh();
      setErr(null);
    } finally {
      setBusy(false);
    }
  }

  const showRefurbFields = condition !== "BRAND_NEW";
  const gradeC = condition === "REFURB_C";

  return (
    <form onSubmit={submit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">
          {mode === "create" ? "New listing" : "Edit listing"}
        </h1>
        <Link href="/vendor/products" className="text-sm text-accent hover:underline">
          Back
        </Link>
      </div>

      {initial?.requiresAdminApproval ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          This Grade C listing is <strong>pending Rentfoxxy admin approval</strong> and is not visible on the
          storefront until approved.
        </div>
      ) : null}

      {err ? <p className="text-sm text-rose-600">{err}</p> : null}

      {mode === "create" ? (
        <div>
          <label className="text-sm font-medium text-slate-700">Catalog product</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Search name or brand…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSelectedProduct(null);
            }}
          />
          <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-100">
            {catalog.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-teal-50 ${selectedProduct?.id === p.id ? "bg-teal-50" : ""}`}
                  onClick={() => {
                    setSelectedProduct(p);
                    setQ(`${p.name} (${p.brand})`);
                  }}
                >
                  <span className="font-medium text-slate-900">{p.name}</span>
                  <span className="text-xs text-muted">{p.brand}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : initial ? (
        <div className="rounded-lg bg-surface p-3 text-sm">
          <p className="font-semibold text-slate-900">{initial.product.name}</p>
          <p className="text-xs text-muted">
            {initial.product.brand} ·{" "}
            <Link className="text-accent hover:underline" href={`/products/${initial.product.slug}`} target="_blank">
              Public page
            </Link>
          </p>
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium text-slate-700">SKU</label>
        <input
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          required
        />
        {mode === "create" ? (
          <p className="mt-1 text-xs text-muted">Leave blank to auto-generate from product + vendor id.</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Unit price (₹)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Minimum bid / unit (₹)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={minBidPrice}
            onChange={(e) => setMinBidPrice(e.target.value)}
            required
          />
          {gradeC ? (
            <p className="mt-1 text-xs text-amber-800">
              Grade C: minimum bid must be at least <strong>15% below</strong> your list price.
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-900">Product condition *</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(GRADE_ORDER as ProductCondition[]).map((key) => {
            const g = GRADE_CONFIG[key];
            const sel = condition === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCondition(key)}
                className={`rounded-xl border-2 p-4 text-left transition ${
                  key === "REFURB_C" ? "sm:col-span-2" : ""
                } ${sel ? "shadow-md" : "border-slate-200 hover:border-slate-300"}`}
                style={{
                  borderColor: sel ? g.color : undefined,
                  background: sel ? `${g.color}0d` : undefined,
                }}
              >
                <p className="text-lg font-bold text-slate-900">
                  <span className="mr-1">{g.dot}</span>
                  {g.label}
                </p>
                <p className="mt-1 text-xs text-muted">{g.description}</p>
              </button>
            );
          })}
        </div>
        {gradeC ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Grade C listings require Rentfoxxy admin review before going live. Your listing will be submitted for
            approval.
          </div>
        ) : null}
      </div>

      {showRefurbFields ? (
        <div className="space-y-4 rounded-xl border border-slate-100 bg-surface p-4">
          <p className="text-sm font-semibold text-slate-800">Additional refurbishment details</p>
          <div>
            <p className="text-sm text-slate-700">Battery health: {batteryHealth}%</p>
            <Slider.Root
              className="relative mt-3 flex h-5 touch-none select-none items-center"
              value={[batteryHealth]}
              onValueChange={(v) => setBatteryHealth(v[0] ?? 50)}
              min={50}
              max={100}
              step={5}
            >
              <Slider.Track className="relative h-1.5 flex-1 rounded-full bg-slate-200">
                <Slider.Range className="absolute h-full rounded-full bg-accent" />
              </Slider.Track>
              <Slider.Thumb
                className="block h-4 w-4 rounded-full border border-slate-400 bg-white shadow focus:outline-none focus:ring-2 focus:ring-accent"
                aria-label="Battery health"
              />
            </Slider.Root>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Warranty type</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={warrantyType}
                onChange={(e) => setWarrantyType(e.target.value)}
              >
                <option value="Rentfoxxy-backed">Rentfoxxy-backed</option>
                <option value="Manufacturer">Manufacturer</option>
                <option value="As-Is">As-Is</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Warranty duration (months)</label>
              <input
                type="number"
                min={0}
                max={24}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Condition notes (max 200)</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              rows={3}
              maxLength={200}
              placeholder="Describe cosmetic condition honestly"
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Refurbished photos (URLs, up to 3)</p>
            <p className="text-xs text-muted">Shows scratches and wear — paste image links you host.</p>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Image URL 1"
              value={refurbUrl1}
              onChange={(e) => setRefurbUrl1(e.target.value)}
            />
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Image URL 2"
              value={refurbUrl2}
              onChange={(e) => setRefurbUrl2(e.target.value)}
            />
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Image URL 3"
              value={refurbUrl3}
              onChange={(e) => setRefurbUrl3(e.target.value)}
            />
          </div>
        </div>
      ) : null}

      <Accordion.Root type="single" collapsible className="rounded-xl border border-slate-200">
        <Accordion.Item value="guide">
          <Accordion.Header>
            <Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-surface">
              Grade guide
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="border-t px-4 pb-3">
            <ul className="mt-2 space-y-2 text-xs text-muted">
              {(GRADE_ORDER as ProductCondition[]).map((k) => {
                const g = GRADE_CONFIG[k];
                return (
                  <li key={k} className="rounded border border-slate-100 bg-white px-2 py-1">
                    <strong className="text-slate-800">
                      {g.dot} {g.label}
                    </strong>{" "}
                    — {g.description}
                  </li>
                );
              })}
            </ul>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Stock quantity</label>
          <input
            type="number"
            min="0"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={stockQty}
            onChange={(e) => setStockQty(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Minimum order qty</label>
          <input
            type="number"
            min="1"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={minOrderQty}
            onChange={(e) => setMinOrderQty(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Bulk pricing (JSON, optional)</label>
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
          rows={5}
          placeholder={`e.g. [{"moq":10,"price":950}]`}
          value={bulkJson}
          onChange={(e) => setBulkJson(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Saving…" : mode === "create" ? "Create listing" : "Save changes"}
      </button>
    </form>
  );
}
