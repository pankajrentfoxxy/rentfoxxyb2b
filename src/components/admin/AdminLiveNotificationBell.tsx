"use client";

import { NotificationBell } from "@/components/shared/NotificationBell";
import type { Notice } from "@/components/shared/NotificationBell";
import { useCallback, useEffect, useState } from "react";

export function AdminLiveNotificationBell() {
  const [items, setItems] = useState<Notice[] | undefined>(undefined);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/notifications?limit=8");
    if (!res.ok) return;
    const data = (await res.json()) as {
      notifications: Array<{
        id: string;
        title: string;
        message: string;
        link: string | null;
        createdAt: string;
        isRead: boolean;
      }>;
    };
    setItems(
      data.notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        link: n.link ?? undefined,
        createdAt: new Date(n.createdAt),
        isRead: n.isRead,
      })),
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!items) {
    return <div className="h-10 w-10 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />;
  }

  return (
    <NotificationBell
      notifications={items}
      viewAllHref="/admin/dashboard"
      readAllPath="/api/admin/notifications/read-all"
      onMarkAllRead={() => load()}
    />
  );
}
