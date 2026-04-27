"use client";

import Logo from "@/components/ui/Logo";
import { VendorLiveNotificationBell } from "@/components/vendor/VendorLiveNotificationBell";
import { UserMenu } from "@/components/shared/UserMenu";
import type { Role, VendorStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  Gavel,
  LayoutDashboard,
  Menu,
  Package,
  IndianRupee,
  User,
  Layers,
  RefreshCw,
  ClipboardList,
  X,
  Truck,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

const nav = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/market-intel", label: "Market Intel", icon: TrendingUp },
  { href: "/vendor/products", label: "Products", icon: Package },
  { href: "/vendor/lots", label: "Lot sales", icon: Layers },
  { href: "/vendor/lots/orders", label: "Lot orders", icon: Truck },
  { href: "/vendor/asas/new", label: "AsAs listing", icon: RefreshCw },
  { href: "/vendor/bids", label: "Bids", icon: Gavel },
  { href: "/vendor/orders", label: "Orders", icon: ShoppingCart },
  { href: "/vendor/payouts", label: "Payouts", icon: IndianRupee },
  { href: "/vendor/profile", label: "Profile", icon: User },
];

function pageTitle(pathname: string): string {
  const hit = nav.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
  if (hit) return hit.label;
  if (pathname.includes("/listings/verifications")) return "Verifications";
  if (pathname.includes("/notifications")) return "Notifications";
  return "Vendor Portal";
}

export function VendorAppShell({
  children,
  email,
  role,
  companyName,
  status,
  marketIntelAlert = false,
}: {
  children: React.ReactNode;
  email: string | null | undefined;
  role: Role;
  companyName: string;
  status: VendorStatus;
  marketIntelAlert?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const title = useMemo(() => pageTitle(pathname), [pathname]);

  const linkCls = (href: string) =>
    cn(
      "flex items-center gap-3 border-l-2 border-transparent px-3 py-2.5 text-[12px] font-medium transition-colors",
      pathname === href || pathname.startsWith(`${href}/`)
        ? "border-verified bg-verified/10 text-verified"
        : "text-white/55 hover:bg-white/6 hover:text-white",
    );

  return (
    <div className="min-h-screen bg-surface">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-white/10 bg-[#0A2618] transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="border-b border-white/10 px-4 pb-4 pt-5">
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
          <p className="mt-3 text-[10px] font-medium uppercase tracking-widest text-white/40">Vendor Portal</p>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 pb-24">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={linkCls(item.href)} onClick={() => setOpen(false)}>
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex flex-1 items-center justify-between gap-2">
                {item.label}
                {item.href === "/vendor/market-intel" && marketIntelAlert ? (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-amber" title="Pricing alert" />
                ) : null}
              </span>
            </Link>
          ))}
          <Link
            href="/vendor/listings/verifications"
            className={linkCls("/vendor/listings/verifications")}
            onClick={() => setOpen(false)}
          >
            <ClipboardList className="h-4 w-4 shrink-0" />
            Verifications
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/20 px-4 py-3">
          <p className="truncate text-[12px] font-medium text-white">{companyName}</p>
          <div className="mt-2">
            {status === "ACTIVE" ? (
              <span className="inline-flex rounded-full bg-verified/20 px-2 py-0.5 text-[10px] font-semibold text-verified">
                Active
              </span>
            ) : status === "PENDING_APPROVAL" ? (
              <span className="inline-flex rounded-full bg-amber/20 px-2 py-0.5 text-[10px] font-semibold text-amber">
                Pending approval
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                Suspended
              </span>
            )}
          </div>
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
            <VendorLiveNotificationBell />
            <UserMenu email={email} role={role} />
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
