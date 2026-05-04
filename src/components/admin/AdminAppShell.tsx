"use client";

import Logo from "@/components/ui/Logo";
import { AdminLiveNotificationBell } from "@/components/admin/AdminLiveNotificationBell";
import { UserMenu } from "@/components/shared/UserMenu";
import { BRAND_COLOR, BRAND_SHADOW, BRAND_TEXT } from "@/components/commonStyle/CommonTable";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Menu,
  Package,
  Users,
  Store,
  Gavel,
  IndianRupee,
  Settings,
  Warehouse,
  RefreshCw,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/vendors", label: "Vendors", icon: Store },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/bids", label: "Bids", icon: Gavel },
  { href: "/admin/payouts", label: "Payouts", icon: IndianRupee },
  { href: "/admin/lots", label: "Lot sales", icon: Warehouse },
  { href: "/admin/asas", label: "AsAs", icon: RefreshCw },
  { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
  { href: "/admin/inspectors", label: "Inspectors", icon: UserCog },
];

function navItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminAppShell({
  children,
  email,
  role,
}: {
  children: React.ReactNode;
  email: string | null | undefined;
  role: Role;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const links = role === "INSPECTION_MANAGER" ? nav.filter((i) => i.href.startsWith("/admin/verifications")) : nav;

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
      {/* Tier 1 — brand bar (matches CommonTable header tone) */}
      <header className={cn("sticky top-0 z-40 shrink-0 flex h-14 w-full items-center shadow-md", BRAND_COLOR, BRAND_SHADOW)}>
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
          <div className="flex shrink-0 items-center gap-3 text-white/90 sm:gap-5">
            <Link
              href="/admin/settings"
              className="rounded p-1 transition-colors hover:bg-white/15 hover:text-white"
              aria-label="Settings"
              onClick={() => setMobileNavOpen(false)}
            >
              <Settings className="h-5 w-5 stroke-[2.5]" />
            </Link>
            <AdminLiveNotificationBell />
            <UserMenu email={email} role={role} triggerVariant="toolbar" />
          </div>
        </div>
      </header>

      {/* Tier 2 — horizontal nav (sticks under 3.5rem brand bar) */}
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
            {links.map((item) => (
              <Link key={item.href} href={item.href} className={navLinkCls(item.href)}>
                <item.icon className={navIconCls(item.href)} aria-hidden />
                {item.label}
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
                {links.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(navLinkCls(item.href), "justify-start")}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <item.icon className={navIconCls(item.href)} aria-hidden />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </nav>

      <main className="flex-1 min-h-0 p-2 pb-14 md:p-2 md:pb-14">{children}</main>

      <footer
        className={`fixed bottom-0 left-0 right-0 z-30 flex h-8 items-center justify-center border-t border-slate-200 bg-amber-600 px-4 text-xs font-bold text-white md:px-6`}
      >
        Copyright © RentFoxxy {new Date().getFullYear()}
      </footer>
 
    </div>
  );
}
