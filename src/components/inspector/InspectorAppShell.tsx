"use client";

import Logo from "@/components/ui/Logo";
import { UserMenu } from "@/components/shared/UserMenu";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ClipboardList, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const nav = [
  { href: "/inspector/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inspector/tasks", label: "My tasks", icon: ClipboardList },
];

export function InspectorAppShell({
  children,
  email,
  name,
  role,
}: {
  children: React.ReactNode;
  email: string | null | undefined;
  name: string;
  role: Role;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const linkCls = (href: string) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
      pathname === href || pathname.startsWith(`${href}/`)
        ? "bg-indigo-100 text-indigo-900"
        : "text-slate-700 hover:bg-indigo-50",
    );

  return (
    <div className="min-h-screen bg-indigo-50/40">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-indigo-100 bg-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center border-b border-indigo-100 px-4">
          <Link href="/" onClick={() => setOpen(false)}>
            <Logo size="sm" variant="dark" />
          </Link>
          <span className="ml-2 rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-900">
            Inspector
          </span>
          <button type="button" className="ml-auto rounded-lg p-2 lg:hidden" onClick={() => setOpen(false)} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1 p-3">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={linkCls(item.href)} onClick={() => setOpen(false)}>
              <item.icon className="h-4 w-4 shrink-0 text-indigo-700" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-indigo-100 p-4">
          <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
        </div>
      </aside>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          aria-label="Close overlay"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-indigo-100 bg-white px-4">
          <button type="button" className="rounded-lg p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <UserMenu email={email} role={role} />
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
