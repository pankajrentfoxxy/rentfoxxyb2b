"use client";

import { useCompareStore } from "@/store/compareStore";
import { BarChart2 } from "lucide-react";
import Link from "next/link";

export function CompareBar() {
  const { items, removeItem, clearAll } = useCompareStore();
  const visible = items.length >= 2;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-navy shadow-2xl transition-transform"
      style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
      aria-hidden={!visible}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <BarChart2 size={16} className="shrink-0 text-amber" />
          <span className="text-[13px] font-medium text-white">
            Comparing {items.length} product{items.length > 1 ? "s" : ""}
          </span>
          <div className="flex min-w-0 flex-wrap gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex max-w-[140px] items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] text-white"
              >
                <span className="truncate">{item.name}</span>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="shrink-0 text-white/60 hover:text-white"
                  aria-label={`Remove ${item.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearAll}
            className="text-[12px] text-white/50 hover:text-white"
          >
            Clear all
          </button>
          <Link
            href="/compare"
            className="rounded-lg bg-amber px-5 py-2 text-[12px] font-semibold text-navy transition-colors hover:bg-amber-dark"
          >
            Compare Now →
          </Link>
        </div>
      </div>
    </div>
  );
}
