"use client";

import {
  CUSTOMER_REVIEW_TAGS_HIGH,
  CUSTOMER_REVIEW_TAGS_LOW,
} from "@/lib/review-tags";
import { cn } from "@/lib/utils";
import { Loader2, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CustomerOrderReviewForm({
  orderId,
  deadlineLabel,
}: {
  orderId: string;
  deadlineLabel: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = rating || hover;
  const pool = (rating || hover) >= 4 ? CUSTOMER_REVIEW_TAGS_HIGH : CUSTOMER_REVIEW_TAGS_LOW;

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
      const res = await fetch("/api/customer/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          rating,
          tags,
          comment: comment.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not submit");
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
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-950">
        Thank you — your review has been submitted. It appears anonymously to other buyers.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-slate-900">How was your experience?</h2>
      <p className="mt-1 text-sm text-muted">{deadlineLabel}</p>

      <div className="mt-4 flex gap-1">
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
                "h-9 w-9 transition-colors",
                n <= active ? "fill-amber-400 text-amber-400" : "text-slate-300",
              )}
            />
          </button>
        ))}
      </div>

      {rating > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {pool.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                tags.includes(tag)
                  ? "border-primary bg-accent-light text-primary"
                  : "border-slate-200 text-slate-700 hover:bg-surface",
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}

      <label className="mt-4 block text-sm font-medium text-slate-800">
        Optional comment
        <textarea
          className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
          rows={3}
          maxLength={500}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share more detail with other B2B buyers…"
        />
      </label>

      {error ? (
        <p className="mt-2 text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={busy || rating < 1}
        onClick={submit}
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit review"}
      </button>
    </div>
  );
}
