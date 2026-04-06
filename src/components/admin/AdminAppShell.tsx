"use client";

import Logo from "@/components/ui/Logo";
import { AdminLiveNotificationBell } from "@/components/admin/AdminLiveNotificationBell";
import { UserMenu } from "@/components/shared/UserMenu";
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
  FileText,
  LineChart,
  Settings,
  Warehouse,
  RefreshCw,
  ShieldCheck,
  UserCog,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/vendors", label: "Vendors", icon: Store },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/bids", label: "Bids", icon: Gavel },
  { href: "/admin/payouts", label: "Payouts", icon: IndianRupee },
  { href: "/admin/invoices", label: "Invoices", icon: FileText },
  { href: "/admin/reports", label: "Reports", icon: LineChart },
  { href: "/admin/lots", label: "Lot sales", icon: Warehouse },
  { href: "/admin/asas", label: "AsAs", icon: RefreshCw },
  { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
  { href: "/admin/inspectors", label: "Inspectors", icon: UserCog },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminAppShell({
  children,
  email,
  role,
}: {
  children: React.ReactNode;
  email: string | null | undefined;
  role: Role;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = role === "INSPECTION_MANAGER" ? nav.filter((i) => i.href.startsWith("/admin/verifications")) : nav;

  const linkCls = (href: string) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
      pathname === href || pathname.startsWith(`${href}/`)
        ? "bg-white/10 text-white"
        : "text-slate-200 hover:bg-white/10 hover:text-white",
    );

  return (
    <div className="min-h-screen bg-slate-100">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-primary transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-4">
          <Link href="/" onClick={() => setOpen(false)} className="text-white">
            <Logo size="sm" variant="light" />
          </Link>
          <span className="rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Admin
          </span>
          <button
            type="button"
            className="ml-auto rounded-lg p-2 text-white lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1 p-3">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className={linkCls(item.href)} onClick={() => setOpen(false)}>
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
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
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 shadow-sm md:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-800 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <AdminLiveNotificationBell />
            <UserMenu email={email} role={role} />
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
