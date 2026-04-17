"use client";

import Logo from "@/components/ui/Logo";
import { UserMenu } from "@/components/shared/UserMenu";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ClipboardList, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

const nav = [
  { href: "/inspector/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inspector/tasks", label: "My tasks", icon: ClipboardList },
];

function pageTitle(pathname: string): string {
  const hit = nav.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
  return hit?.label ?? "Inspector";
}

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
  const title = useMemo(() => pageTitle(pathname), [pathname]);

  const linkCls = (href: string) =>
    cn(
      "flex items-center gap-3 border-l-2 border-transparent px-3 py-2.5 text-[12px] font-medium transition-colors",
      pathname === href || pathname.startsWith(`${href}/`)
        ? "border-teal-400 bg-teal-500/10 text-teal-300"
        : "text-white/55 hover:bg-white/6 hover:text-white",
    );

  return (
    <div className="min-h-screen bg-surface">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-white/10 bg-[#042f2e] transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
          <Link href="/" onClick={() => setOpen(false)} className="block">
            <Logo variant="nav" size="sm" />
          </Link>
          <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-teal-300">
            Field
          </span>
          <button type="button" className="ml-auto rounded-lg p-2 text-white/70 lg:hidden" onClick={() => setOpen(false)} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 pb-20">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={linkCls(item.href)} onClick={() => setOpen(false)}>
              <item.icon className="h-4 w-4 shrink-0 text-teal-400/90" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/20 px-4 py-3">
          <p className="truncate text-[12px] font-medium text-white/90">{name}</p>
          <p className="truncate text-[10px] text-white/45">{email}</p>
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
            <button type="button" className="rounded-lg p-2 text-ink-secondary lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="truncate text-[15px] font-medium text-ink-primary">{title}</h1>
          </div>
          <UserMenu email={email} role={role} />
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
