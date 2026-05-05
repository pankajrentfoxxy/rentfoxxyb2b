"use client";

import Logo from "@/components/ui/Logo";
import { CustomerLiveNotificationBell } from "@/components/customer/CustomerLiveNotificationBell";
import { UserMenu } from "@/components/shared/UserMenu";
import { BRAND_COLOR, BRAND_SHADOW, BRAND_TEXT } from "@/components/commonStyle/CommonTable";
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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const nav = [
  { href: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customer/orders", label: "My Orders", icon: Package },
  { href: "/customer/bids", label: "My Bids", icon: MessageSquare },
  { href: "/customer/watchlist", label: "Price Watch", icon: Bell },
  { href: "/customer/invoices", label: "Invoices", icon: FileText },
  { href: "/customer/tracking", label: "Tracking", icon: Truck },
  { href: "/customer/profile", label: "Profile", icon: User },
];

function navItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const navLinkCls = (href: string) =>
    cn(
      "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
      navItemActive(pathname, href)
        ? cn(BRAND_COLOR, BRAND_SHADOW, "text-white ring-1 ring-amber-700/30")
        : "text-slate-700 hover:bg-amber-50 hover:text-slate-900",
    );

  const navIconCls = (href: string) =>
    cn(
      "h-4 w-4 shrink-0",
      navItemActive(pathname, href) ? "text-white opacity-100" : cn(BRAND_TEXT, "opacity-80"),
    );

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className={cn("sticky top-0 z-40 flex h-14 w-full shrink-0 items-center shadow-md", BRAND_COLOR, BRAND_SHADOW)}>
        <div
          className="absolute left-0 top-0 flex h-full items-center bg-white pl-4 pr-14 sm:pl-6 sm:pr-20"
          style={{
            width: "min(400px, 92vw)",
            clipPath: "path('M 0 0 H 280 C 320 0 300 56 340 56 H 0 Z')",
          }}
        >
          <Link
            href="/"
            className={cn("flex min-w-0 items-center gap-2 transition-opacity hover:opacity-90", BRAND_TEXT)}
            onClick={() => setMobileNavOpen(false)}
          >
            <Logo variant="nav-on-light" size="sm" />
          </Link>
        </div>

        <div className="ml-[min(280px,72vw)] flex min-w-0 flex-1 items-center justify-end gap-2 px-3 sm:gap-4 sm:px-4">
          {/* <div className="mr-auto hidden min-w-0 max-w-[min(240px,40vw)] md:block">
            <p className="truncate text-[13px] font-semibold text-white/95" title={email ?? undefined}>
              {email ?? "Signed in"}
            </p>
            <p className="truncate text-[10px] font-medium text-white/70">Customer portal</p>
          </div> */}
          <div className="flex shrink-0 items-center gap-3 text-white/90 sm:gap-5">
            <CustomerLiveNotificationBell />
            <UserMenu email={email} role={role} triggerVariant="toolbar" />
          </div>
        </div>
      </header>

      <nav className={cn("sticky top-14 z-30 shrink-0 border-b bg-white shadow-sm", "border-amber-100")}>
        <div className="relative mx-auto flex max-w-[1600px] items-center gap-2 px-3 py-2 md:px-4">
          <button
            type="button"
            className={cn(
              "rounded-lg p-2 text-slate-600 transition-colors hover:bg-amber-50 hover:text-amber-700 md:hidden",
            )}
            aria-label="Open menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="hidden min-w-0 flex-1 flex-wrap items-center gap-1 md:flex lg:gap-1">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className={navLinkCls(item.href)}>
                <item.icon className={navIconCls(item.href)} aria-hidden />
                <span className="flex items-center gap-2">
                  {item.label}
                  {item.href === "/customer/watchlist" && watchAlertCount > 0 ? (
                    <span
                      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-black text-amber-950"
                      title={`${watchAlertCount} price target(s) reached`}
                    >
                      {watchAlertCount > 9 ? "9+" : watchAlertCount}
                    </span>
                  ) : null}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {mobileNavOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[45] bg-black/40 md:hidden"
              aria-label="Close menu"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="absolute left-0 right-0 top-full z-[50] max-h-[70vh] overflow-y-auto border-b border-amber-100 bg-white py-2 shadow-lg md:hidden">
              <div className="flex flex-col px-2">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(navLinkCls(item.href), "justify-start")}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <item.icon className={navIconCls(item.href)} aria-hidden />
                    <span className="flex flex-1 items-center justify-between gap-2">
                      {item.label}
                      {item.href === "/customer/watchlist" && watchAlertCount > 0 ? (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-black text-amber-950">
                          {watchAlertCount > 9 ? "9+" : watchAlertCount}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </nav>

      <main className="min-h-0 flex-1 p-2 pb-14 md:p-2 md:pb-14">{children}</main>

      <footer
        className="fixed bottom-0 left-0 right-0 z-30 flex h-8 items-center justify-center border-t border-slate-200 bg-amber-600 px-4 text-xs font-bold text-white md:px-6"
      >
        Copyright © RentFoxxy {new Date().getFullYear()}
      </footer>
    </div>
  );
}
