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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const nav = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/products", label: "Products", icon: Package },
  { href: "/vendor/lots", label: "Lot sales", icon: Layers },
  { href: "/vendor/asas/new", label: "New AsAs", icon: RefreshCw },
  { href: "/vendor/listings/verifications", label: "Verifications", icon: ClipboardList },
  { href: "/vendor/bids", label: "Bids", icon: Gavel },
  { href: "/vendor/orders", label: "Orders", icon: Package },
  { href: "/vendor/payouts", label: "Payouts", icon: IndianRupee },
  { href: "/vendor/profile", label: "Profile", icon: User },
];

export function VendorAppShell({
  children,
  email,
  role,
  companyName,
  status,
}: {
  children: React.ReactNode;
  email: string | null | undefined;
  role: Role;
  companyName: string;
  status: VendorStatus;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const linkCls = (href: string) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
      pathname === href || pathname.startsWith(`${href}/`)
        ? "bg-teal-50 text-teal-800"
        : "text-slate-700 hover:bg-teal-50/50",
    );

  return (
    <div className="min-h-screen bg-teal-50/30">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-teal-100 bg-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center border-b border-teal-100 px-4">
          <Link href="/" onClick={() => setOpen(false)}>
            <Logo size="sm" variant="dark" />
          </Link>
          <button
            type="button"
            className="ml-auto rounded-lg p-2 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1 overflow-y-auto p-3 pb-28">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={linkCls(item.href)} onClick={() => setOpen(false)}>
              <item.icon className="h-4 w-4 shrink-0 text-[#0F766E]" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-teal-100 p-4">
          <p className="truncate text-sm font-semibold text-slate-900">{companyName}</p>
          <div className="mt-2">
            {status === "ACTIVE" ? (
              <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                Active
              </span>
            ) : status === "PENDING_APPROVAL" ? (
              <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                Pending approval
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                Suspended
              </span>
            )}
          </div>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          aria-label="Close overlay"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-teal-100 bg-white/90 px-4 backdrop-blur md:px-6">
          <button
            type="button"
            className="rounded-lg p-2 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <VendorLiveNotificationBell />
            <UserMenu email={email} role={role} />
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
