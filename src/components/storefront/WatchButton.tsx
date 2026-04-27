"use client";

import { BTN } from "@/constants/design";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { Bell, BellRing } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type WatchButtonProps = {
  productId: string;
  productSlug: string;
  currentMinPrice: number;
  /** Smaller control for product header row */
  compact?: boolean;
};

export function WatchButton({ productId, productSlug, currentMinPrice, compact }: WatchButtonProps) {
  const { status } = useSession();
  const [target, setTarget] = useState(() =>
    Math.max(1, Math.floor(currentMinPrice * 0.95)),
  );
  const [watching, setWatching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") return;
    const res = await fetch("/api/customer/watchlist");
    if (!res.ok) return;
    const j = (await res.json()) as { watches?: { productId: string }[] };
    const list = j.watches ?? [];
    setWatching(list.some((w) => w.productId === productId));
    setLoaded(true);
  }, [status, productId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setTarget(Math.max(1, Math.floor(currentMinPrice * 0.95)));
  }, [currentMinPrice]);

  if (status === "loading") {
    return compact ? null : <p className="text-[11px] text-ink-muted">…</p>;
  }

  if (status === "unauthenticated") {
    return (
      <Link
        href={`/auth/login?callbackUrl=${encodeURIComponent(`/products/${productSlug}`)}`}
        className={cn(
          compact ? "text-[11px] font-medium text-lot hover:underline" : `${BTN.bid} px-3 py-2 text-[11px]`,
        )}
      >
        Sign in to watch price
      </Link>
    );
  }

  async function saveWatch() {
    setBusy(true);
    try {
      const res = await fetch("/api/customer/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, targetPrice: target }),
      });
      if (res.ok) {
        setWatching(true);
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function stopWatch() {
    const res = await fetch("/api/customer/watchlist");
    if (!res.ok) return;
    const j = (await res.json()) as { watches?: { id: string; productId: string }[] };
    const row = (j.watches ?? []).find((w) => w.productId === productId);
    if (!row) {
      setWatching(false);
      return;
    }
    setBusy(true);
    try {
      await fetch(`/api/customer/watchlist/${row.id}`, { method: "DELETE" });
      setWatching(false);
    } finally {
      setBusy(false);
    }
  }

  if (compact && watching && loaded) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => void stopWatch()}
        className="inline-flex items-center gap-1 rounded-lg border border-lot-border bg-lot-bg px-2.5 py-1 text-[11px] font-medium text-lot-text hover:opacity-90 disabled:opacity-50"
      >
        <BellRing className="h-3.5 w-3.5" />
        Watching
      </button>
    );
  }

  if (compact && !watching) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 text-[10px] text-ink-muted">
          Target ₹
          <input
            type="number"
            min={1}
            className="w-24 rounded border border-border bg-white px-2 py-1 text-[11px] text-ink-primary"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          disabled={busy || !loaded}
          onClick={() => void saveWatch()}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-ink-secondary hover:border-lot hover:text-lot disabled:opacity-50"
        >
          <Bell className="h-3.5 w-3.5" />
          Watch price
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[12px] font-medium text-ink-primary">Price watch</p>
      <p className="mt-1 text-[11px] text-ink-muted">
        Get emailed when the lowest storefront price hits your target (checked daily).
      </p>
      {watching ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void stopWatch()}
          className={`${BTN.bid} mt-3 w-full py-2 text-[12px]`}
        >
          Stop watching
        </button>
      ) : (
        <>
          <label className="mt-3 block text-[11px] text-ink-muted">
            Target price (₹ / unit, ex-GST)
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveWatch()}
            className={`${BTN.navy} mt-3 w-full py-2.5 text-[12px]`}
          >
            Save watch
          </button>
        </>
      )}
    </div>
  );
}
