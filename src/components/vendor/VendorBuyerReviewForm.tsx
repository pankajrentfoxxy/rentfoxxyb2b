"use client";

import { VENDOR_REVIEW_TAGS } from "@/lib/review-tags";
import { cn } from "@/lib/utils";
import { Loader2, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function VendorBuyerReviewForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = rating || hover;

  function toggleTag(tag: string) {
    setTags((cur) => (cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag].slice(0, 6)));
  }

  async function submit() {
    if (rating < 1) {
      setError("Choose a star rating.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/vendor/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, rating, tags }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save");
        return;
      }
      setDone(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-emerald-800">Rating saved. This stays private to your team.</p>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Rate this buyer</h2>
      <p className="mt-1 text-xs text-muted">Private — not shown to the customer</p>

      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className="p-1"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
          >
            <Star
              className={cn(
                "h-8 w-8 transition-colors",
                n <= active ? "fill-amber-400 text-amber-400" : "text-slate-300",
              )}
            />
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {VENDOR_REVIEW_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium",
              tags.includes(tag)
                ? "border-teal-700 bg-teal-50 text-teal-900"
                : "border-slate-200 text-slate-700 hover:bg-surface",
            )}
          >
            {tag}
          </button>
        ))}
      </div>

      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}

      <button
        type="button"
        disabled={busy || rating < 1}
        onClick={submit}
        className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save rating"}
      </button>
    </div>
  );
}
