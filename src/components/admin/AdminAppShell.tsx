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
import { useMemo, useState } from "react";

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

function pageTitle(pathname: string, links: typeof nav): string {
  const hit = links.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
  return hit?.label ?? "Admin";
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
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = role === "INSPECTION_MANAGER" ? nav.filter((i) => i.href.startsWith("/admin/verifications")) : nav;
  const title = useMemo(() => pageTitle(pathname, links), [pathname, links]);

  const linkCls = (href: string) =>
    cn(
      "flex items-center gap-3 border-l-2 border-transparent px-3 py-2.5 text-[12px] font-medium transition-colors",
      pathname === href || pathname.startsWith(`${href}/`)
        ? "border-amber bg-amber/10 text-amber"
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
        <div className="bg-amber px-4 py-2 text-center text-[10px] font-bold tracking-widest text-navy">RENTFOXXY ADMIN</div>
        <div className="flex items-center gap-2 border-b border-white/8 px-4 py-4">
          <Link href="/" onClick={() => setOpen(false)} className="text-white">
            <Logo variant="nav" size="sm" />
          </Link>
          <button
            type="button"
            className="ml-auto rounded-lg p-2 text-white lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className={linkCls(item.href)} onClick={() => setOpen(false)}>
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
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
            <AdminLiveNotificationBell />
            <UserMenu email={email} role={role} />
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
