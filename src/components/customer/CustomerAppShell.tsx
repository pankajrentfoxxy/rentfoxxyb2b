"use client";

import Logo from "@/components/ui/Logo";
import { CustomerLiveNotificationBell } from "@/components/customer/CustomerLiveNotificationBell";
import { UserMenu } from "@/components/shared/UserMenu";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  FileText,
  Gavel,
  Inbox,
  LayoutDashboard,
  MapPin,
  Menu,
  Package,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const nav = [
  { href: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customer/orders", label: "Orders", icon: Package },
  { href: "/customer/bids", label: "Bids", icon: Gavel },
  { href: "/customer/invoices", label: "Invoices", icon: FileText },
  { href: "/customer/tracking", label: "Tracking", icon: MapPin },
  { href: "/customer/profile", label: "Profile", icon: User },
  { href: "/customer/notifications", label: "Notifications", icon: Inbox },
];

export function CustomerAppShell({
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

  const linkCls = (href: string) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
      pathname === href || pathname.startsWith(`${href}/`)
        ? "bg-accent-light text-accent"
        : "text-slate-700 hover:bg-surface",
    );

  return (
    <div className="min-h-screen bg-surface">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center border-b border-slate-100 px-4">
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
        <nav className="space-y-1 p-3">
          {nav.map((item) => (
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
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-6">
          <button
            type="button"
            className="rounded-lg p-2 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <CustomerLiveNotificationBell />
            <UserMenu email={email} role={role} />
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
