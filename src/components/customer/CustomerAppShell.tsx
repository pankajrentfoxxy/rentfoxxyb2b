"use client";

import Logo from "@/components/ui/Logo";
import { CustomerLiveNotificationBell } from "@/components/customer/CustomerLiveNotificationBell";
import { UserMenu } from "@/components/shared/UserMenu";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  Bell,
  FileText,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Package,
  Truck,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

const nav = [
  { href: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customer/orders", label: "My Orders", icon: Package },
  { href: "/customer/bids", label: "My Bids", icon: MessageSquare },
  { href: "/customer/watchlist", label: "Price Watch", icon: Bell },
  { href: "/customer/invoices", label: "Invoices", icon: FileText },
  { href: "/customer/tracking", label: "Tracking", icon: Truck },
  { href: "/customer/profile", label: "Profile", icon: User },
];

function pageTitle(pathname: string): string {
  const hit = nav.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
  if (hit) return hit.label;
  if (pathname.startsWith("/customer/notifications")) return "Notifications";
  if (pathname.startsWith("/customer/watchlist")) return "Price Watch";
  return "My Account";
}

export function CustomerAppShell({
  children,
  email,
  role,
  watchAlertCount = 0,
}: {
  children: React.ReactNode;
  email: string | null | undefined;
  role: Role;
  watchAlertCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const title = useMemo(() => pageTitle(pathname), [pathname]);

  const linkCls = (href: string) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-medium transition-colors",
      pathname === href || pathname.startsWith(`${href}/`)
        ? "bg-white/10 font-medium text-white"
        : "text-white/55 hover:bg-white/6 hover:text-white",
    );

  return (
    <div className="min-h-screen bg-surface">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-white/8 bg-navy transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="border-b border-white/8 px-4 pb-4 pt-5">
          <div className="flex items-start justify-between gap-2">
            <Link href="/" onClick={() => setOpen(false)} className="block">
              <Logo variant="nav" size="sm" />
            </Link>
            <button
              type="button"
              className="rounded-lg p-2 text-white/70 lg:hidden"
              onClick={() => setOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-3 text-[10px] font-medium uppercase tracking-widest text-white/40">My Account</p>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={linkCls(item.href)} onClick={() => setOpen(false)}>
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex flex-1 items-center justify-between gap-2">
                {item.label}
                {item.href === "/customer/watchlist" && watchAlertCount > 0 ? (
                  <span className="rounded-full bg-amber px-1.5 py-0.5 text-[9px] font-bold text-navy">
                    {watchAlertCount}
                  </span>
                ) : null}
              </span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/8 bg-white/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <CustomerLiveNotificationBell className="border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/15 hover:text-white" />
            <span className="min-w-0 flex-1 truncate text-[11px] text-white/60">{email ?? "Signed in"}</span>
          </div>
          <p className="mt-2 text-[10px] text-white/35">Use the menu (top right) to sign out.</p>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Close overlay"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="lg:pl-56">
        <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-3 border-b border-border bg-white px-4 py-3 md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-ink-secondary lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="truncate text-[15px] font-medium text-ink-primary">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CustomerLiveNotificationBell />
            <UserMenu email={email} role={role} />
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
