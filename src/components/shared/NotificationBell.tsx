"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type Notice = {
  id: string;
  title: string;
  message: string;
  link?: string;
  createdAt: Date;
  isRead: boolean;
};

export function NotificationBell({
  notifications,
  className,
  viewAllHref = "/customer/notifications",
  readAllPath = "/api/customer/notifications/read-all",
  onMarkAllRead,
}: {
  notifications?: Notice[];
  className?: string;
  viewAllHref?: string;
  readAllPath?: string;
  /** After API mark-all, parent can refetch */
  onMarkAllRead?: () => void | Promise<void>;
}) {
  const [items, setItems] = useState<Notice[]>(notifications ?? demoNotices);
  useEffect(() => {
    if (notifications) setItems(notifications);
  }, [notifications]);

  const unread = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

  const markAllRead = async () => {
    if (onMarkAllRead) {
      try {
        await fetch(readAllPath, { method: "PUT" });
      } catch {
        /* ignore */
      }
      await onMarkAllRead();
      return;
    }
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative rounded p-1 transition-colors hover:bg-white/15 hover:text-white",
            className,
          )}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 stroke-[2.5] text-white" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <button
            type="button"
            className="text-xs font-medium text-accent hover:underline"
            onClick={(e) => {
              e.preventDefault();
              markAllRead();
            }}
          >
            Mark all read
          </button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-72 overflow-y-auto">
          {items.slice(0, 5).map((n) => (
            <DropdownMenuItem key={n.id} asChild className="cursor-default flex-col items-stretch p-0">
              <div
                className={cn(
                  "w-full px-2 py-2 text-left",
                  !n.isRead && "bg-accent-light/40",
                )}
              >
                {n.link ? (
                  <Link href={n.link} className="block" onClick={() => undefined}>
                    <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                    <p className="text-xs text-muted line-clamp-2">{n.message}</p>
                  </Link>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                    <p className="text-xs text-muted line-clamp-2">{n.message}</p>
                  </>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={viewAllHref} className="w-full text-center font-medium text-accent">
            View all
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const demoNotices: Notice[] = [
  {
    id: "1",
    title: "Welcome to Rentfoxxy",
    message: "Your B2B storefront is ready. Explore bids and bulk pricing next.",
    link: "/customer/dashboard",
    createdAt: new Date(),
    isRead: false,
  },
  {
    id: "2",
    title: "Sample notification",
    message: "Live data will appear here after Phase 1.",
    createdAt: new Date(),
    isRead: false,
  },
];
