"use client";

import { Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type ReviewDto = {
  rating: number;
  comment: string | null;
  tags: string[];
  grade: string;
  createdAt: string;
  attribution: string;
};

export function ProductReviewsSection({ slug }: { slug: string }) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [aggregate, setAggregate] = useState<{ avg: number; count: number; distribution: Record<number, number> } | null>(null);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (p: number, append: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/products/${encodeURIComponent(slug)}/reviews?page=${p}`);
      const data = await res.json();
      if (!res.ok) return;
      if (!append) setAggregate(data.aggregate);
      setHasMore(!!data.hasMore);
      setReviews((cur) => (append ? [...cur, ...data.reviews] : data.reviews));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    setPage(1);
    load(1, false);
  }, [load]);

  if (loading && !aggregate) {
    return (
      <section className="mt-12 rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-muted">Loading reviews…</p>
      </section>
    );
  }

  if (!aggregate || aggregate.count === 0) {
    return null;
  }

  const dist = aggregate.distribution;

  return (
    <section className="mt-12 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Customer reviews</h2>
      <p className="mt-1 text-sm text-muted">Verified purchase feedback (supplier names never shown)</p>

      <div className="mt-6 flex flex-wrap items-start gap-8">
        <div>
          <p className="text-4xl font-bold text-primary">{aggregate.avg.toFixed(1)}</p>
          <div className="mt-1 flex">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`h-5 w-5 ${n <= Math.round(aggregate.avg) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">{aggregate.count} verified purchases</p>
        </div>
        <div className="min-w-[220px] flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((n) => {
            const c = dist[n] ?? 0;
            const pct = aggregate.count ? Math.round((c / aggregate.count) * 100) : 0;
            return (
              <div key={n} className="flex items-center gap-2 text-xs">
                <span className="w-6 text-muted">{n}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded bg-slate-100">
                  <div className="h-full rounded bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-muted">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <ul className="mt-8 divide-y divide-slate-100">
        {reviews.map((r, i) => (
          <li key={`${r.createdAt}-${i}`} className="py-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-4 w-4 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                  />
                ))}
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                {r.grade}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {r.tags.map((t) => (
                <span key={t} className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-700">
                  {t}
                </span>
              ))}
            </div>
            {r.comment ? (
              <p className="mt-2 text-sm text-slate-800">
                {r.comment.length > 220 ? `${r.comment.slice(0, 220)}…` : r.comment}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-muted">
              {r.attribution} · {new Date(r.createdAt).toLocaleDateString("en-IN")}
            </p>
          </li>
        ))}
      </ul>

      {hasMore ? (
        <button
          type="button"
          disabled={loading}
          className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-surface disabled:opacity-50"
          onClick={() => {
            const next = page + 1;
            setPage(next);
            load(next, true);
          }}
        >
          {loading ? "Loading…" : "Load more reviews"}
        </button>
      ) : null}
    </section>
  );
}
