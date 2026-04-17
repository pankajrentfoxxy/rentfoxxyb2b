"use client";

import { normalizeProductImages, parseProductImageInput } from "@/lib/image-url";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminProductEditor({
  productId,
  initial,
}: {
  productId: string;
  initial: {
    name: string;
    slug: string;
    description: string;
    brand: string;
    hsnCode: string;
    isFeatured: boolean;
    inspectorVerified: boolean;
    isActive: boolean;
    images: string[];
    specs: unknown;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [description, setDescription] = useState(initial.description);
  const [brand, setBrand] = useState(initial.brand);
  const [hsnCode, setHsnCode] = useState(initial.hsnCode);
  const [isFeatured, setIsFeatured] = useState(initial.isFeatured);
  const [inspectorVerified, setInspectorVerified] = useState(initial.inspectorVerified);
  const [isActive, setIsActive] = useState(initial.isActive);
  const [imagesText, setImagesText] = useState(normalizeProductImages(initial.images).join("\n"));
  const [specsText, setSpecsText] = useState(JSON.stringify(initial.specs, null, 2));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    let specs: unknown;
    try {
      specs = JSON.parse(specsText);
    } catch {
      setErr("Specs must be valid JSON");
      return;
    }
    const images = parseProductImageInput(imagesText);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description,
          brand,
          hsnCode,
          isFeatured,
          inspectorVerified,
          isActive,
          images,
          specs,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Save failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {err ? <p className="text-sm text-rose-600">{err}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="font-medium text-slate-700">Name</span>
          <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="font-medium text-slate-700">Slug</span>
          <input className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">Brand</span>
          <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </label>
      </div>
      <label className="text-sm block">
        <span className="font-medium text-slate-700">Description</span>
        <textarea className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label className="text-sm block">
        <span className="font-medium text-slate-700">HSN code</span>
        <input className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} />
      </label>
      <label className="text-sm block">
        <span className="font-medium text-slate-700">
          Images (one per line or comma-separated; use{" "}
          <code className="rounded bg-slate-100 px-1">/products/file.webp</code> not{" "}
          <code className="rounded bg-slate-100 px-1">/public/...</code>)
        </span>
        <textarea className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-xs" rows={3} value={imagesText} onChange={(e) => setImagesText(e.target.value)} />
      </label>
      <label className="text-sm block">
        <span className="font-medium text-slate-700">Specs (JSON)</span>
        <textarea className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-xs" rows={8} value={specsText} onChange={(e) => setSpecsText(e.target.value)} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> Featured
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={inspectorVerified}
          onChange={(e) => setInspectorVerified(e.target.checked)}
        />{" "}
        Inspector verified (show Verified badge on storefront)
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active on storefront
      </label>
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save product"}
      </button>
    </form>
  );
}
