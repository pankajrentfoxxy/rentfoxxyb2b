"use client";

import { MegaMenu, MegaMenuDrawerSection } from "@/components/storefront/MegaMenu";
import Logo from "@/components/ui/Logo";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, ShoppingCart, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const primaryNav = [
  { href: "/sales/lots", label: "Sales", badge: "Hot" as const },
  { href: "/asas/listings", label: "AsAs", badge: "Deals" as const },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function NavLink({ href, label, badge }: { href: string; label: string; badge?: "Hot" | "Deals" }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href.split("?")[0]!));
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium transition",
        active ? "text-accent" : "text-slate-700 hover:text-accent",
      )}
    >
      {label}
      {badge === "Hot" ? (
        <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-orange-800">
          Hot
        </span>
      ) : null}
      {badge === "Deals" ? (
        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-purple-800">
          Deals
        </span>
      ) : null}
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session, status } = useSession();
  const itemCount = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0),
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-transparent transition-colors",
        scrolled && "border-slate-200/80 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60",
        !scrolled && "bg-white/95",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <Logo size="md" variant="dark" />
        </Link>

        <nav className="hidden flex-wrap items-center gap-x-6 gap-y-2 lg:flex">
          <MegaMenu />
          {primaryNav.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} badge={l.badge} />
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-accent-light hover:text-accent"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>

          {status === "loading" ? (
            <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-100" />
          ) : session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-surface text-slate-800 transition hover:border-accent hover:text-accent"
                  aria-label="Account menu"
                >
                  <UserRound className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link
                    href={
                      session.user.role === "CUSTOMER"
                        ? "/customer/dashboard"
                        : session.user.role === "VENDOR"
                          ? "/vendor/dashboard"
                          : "/admin/dashboard"
                    }
                  >
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-danger focus:text-danger"
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/auth/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-surface"
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light"
              >
                Get started
              </Link>
            </div>
          )}

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-800 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-2">
            <MegaMenuDrawerSection onNavigate={() => setOpen(false)} />
            {primaryNav.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-base font-medium text-slate-800 hover:bg-surface"
                onClick={() => setOpen(false)}
              >
                {l.label}
                {l.badge ? ` · ${l.badge}` : ""}
              </Link>
            ))}
            {!session?.user && (
              <div className="mt-2 flex flex-col gap-2">
                <Link
                  href="/auth/login"
                  className="rounded-lg border border-slate-200 py-3 text-center text-sm font-semibold text-slate-800"
                  onClick={() => setOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-lg bg-primary py-3 text-center text-sm font-semibold text-white"
                  onClick={() => setOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
