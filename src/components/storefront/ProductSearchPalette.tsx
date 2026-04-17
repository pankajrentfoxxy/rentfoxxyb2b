"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function ProductSearchPalette({
  className = "",
  compact = false,
}: {
  /** Extra classes for the trigger (desktop pill). */
  className?: string;
  /** Minimal trigger for mobile drawer. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();

  const go = useCallback(() => {
    const s = q.trim();
    setOpen(false);
    setQ("");
    if (s) router.push(`/products?search=${encodeURIComponent(s)}`);
    else router.push("/products");
  }, [q, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex w-full items-center gap-2 rounded-lg border border-white/12 bg-white/10 px-3 py-2 text-left text-sm text-white/70 ${className}`}
        >
          <Search className="h-4 w-4 shrink-0" />
          Search catalog
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`hidden cursor-pointer items-center gap-2 rounded border border-white/12 bg-white/[0.07] px-3 py-1.5 text-left md:inline-flex ${className}`}
        >
          <span className="text-xs text-white/40">Search laptops…</span>
          <kbd className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] text-white/25">⌘K</kbd>
        </button>
      )}

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[18vh]">
          <button
            type="button"
            className="absolute inset-0 bg-navy/40 backdrop-blur-[2px]"
            aria-label="Close search"
            onClick={() => setOpen(false)}
          />
          <div
            className="relative w-full max-w-lg rounded-xl border border-border bg-card p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
          >
            <div className="flex items-center gap-2 border-b border-border-light pb-3">
              <Search className="h-5 w-5 shrink-0 text-ink-muted" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") go();
                  if (e.key === "Escape") setOpen(false);
                }}
                placeholder="Search by brand, model, SKU…"
                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink-primary outline-none placeholder:text-ink-muted"
              />
            </div>
            <p className="mt-3 text-[11px] text-ink-muted">
              Press Enter to open the catalog with your search.{" "}
              <button type="button" className="font-medium text-lot hover:underline" onClick={go}>
                Browse all products
              </button>
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
