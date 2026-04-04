"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell, ChevronLeft, ChevronRight } from "lucide-react";

type N = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export function CustomerNotificationsPage() {
  const [items, setItems] = useState<N[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 15;

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customer/notifications?page=${p}&limit=${limit}`);
      const data = await res.json();
      if (!res.ok) return;
      setItems(data.notifications ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [load, page]);

  async function markAllRead() {
    await fetch("/api/customer/notifications/read-all", { method: "PUT" });
    load(page);
  }

  async function markOne(id: string) {
    await fetch(`/api/customer/notifications/${id}`, { method: "PATCH" });
    load(page);
  }

  const pages = Math.max(1, Math.ceil(total / limit));

  function timeAgo(iso: string) {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-muted">Updates on orders, bids, and account activity.</p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          className="text-sm font-medium text-accent hover:underline"
        >
          Mark all as read
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {items.length === 0 ? (
            <li className="px-4 py-12 text-center text-sm text-muted">No notifications yet.</li>
          ) : (
            items.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "flex gap-3 px-4 py-4",
                  !n.isRead && "bg-accent-light/30",
                )}
              >
                <div className="mt-0.5 rounded-lg bg-surface p-2 text-accent">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  {n.link ? (
                    <Link href={n.link} className="font-semibold text-slate-900 hover:text-accent">
                      {n.title}
                    </Link>
                  ) : (
                    <p className="font-semibold text-slate-900">{n.title}</p>
                  )}
                  <p className="text-sm text-muted">{n.message}</p>
                  <p className="mt-1 text-xs text-muted">{timeAgo(n.createdAt)}</p>
                  {!n.isRead ? (
                    <button
                      type="button"
                      onClick={() => markOne(n.id)}
                      className="mt-2 text-xs font-medium text-accent hover:underline"
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      {pages > 1 ? (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="text-sm text-muted">
            Page {page} of {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
