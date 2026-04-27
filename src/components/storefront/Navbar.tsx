"use client";

import { CustomerLiveNotificationBell } from "@/components/customer/CustomerLiveNotificationBell";
import { MegaMenu, MegaMenuDrawerSection } from "@/components/storefront/MegaMenu";
import { ProductSearchPalette } from "@/components/storefront/ProductSearchPalette";
import Logo from "@/components/ui/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { ChevronRight, Menu, ShoppingCart, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

function userInitials(name: string | null | undefined, email: string | null | undefined) {
  const n = name?.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0]!}${parts[parts.length - 1]![0]!}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

export function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const itemCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const lotsActive = pathname === "/sales/lots" || pathname.startsWith("/sales/lots/");
  const asasActive = pathname === "/asas/listings" || pathname.startsWith("/asas/listings/");
  const aboutActive = pathname === "/about" || pathname.startsWith("/about/");

  return (
    <header className="sticky top-0 z-50 h-[50px] border-b border-white/5 bg-navy">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4">
          <Link href="/" className="shrink-0">
            <Logo variant="nav" size="sm" />
          </Link>
          <span className="hidden h-6 w-px shrink-0 bg-white/10 sm:block" aria-hidden />

          <nav className="hidden min-w-0 items-center gap-1 lg:flex">
            <MegaMenu />
            <Link
              href="/sales/lots"
              className={cn(
                "whitespace-nowrap px-2 py-2 text-sm font-medium",
                lotsActive ? "font-semibold text-amber" : "text-amber hover:text-amber",
              )}
            >
              🔥 Lot Sales
            </Link>
            <Link
              href="/asas/listings"
              className={cn(
                "px-2 py-2 text-sm font-medium text-asas/80 hover:text-asas",
                asasActive && "text-white",
              )}
            >
              AsAs Deals
            </Link>
            <Link
              href="/about"
              className={cn(
                "px-2 py-2 text-sm font-medium text-white/55 hover:text-white",
                aboutActive && "font-medium text-white",
              )}
            >
              About
            </Link>
            <Link
              href="/tools/fleet-calculator"
              className="whitespace-nowrap px-2 py-2 text-sm font-medium text-white/55 hover:text-amber"
            >
              Fleet calc
            </Link>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ProductSearchPalette />

          <Link
            href="/cart"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber px-1 text-[10px] font-bold text-navy">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            ) : null}
          </Link>

          {status === "loading" ? (
            <div className="h-7 w-20 animate-pulse rounded bg-white/10" />
          ) : session?.user ? (
            <div className="hidden items-center gap-2 sm:flex">
              {session.user.role === "CUSTOMER" ? (
                <CustomerLiveNotificationBell className="h-9 w-9 rounded-lg border-0 bg-transparent text-white/60 hover:bg-white/10 hover:text-white" />
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white transition hover:bg-white/15"
                    aria-label="Account menu"
                  >
                    {userInitials(session.user.name, session.user.email)}
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
            </div>
          ) : (
            <div className="hidden items-center gap-1 sm:flex">
              <Link
                href="/auth/login"
                className="whitespace-nowrap px-3 text-xs text-white/50 transition hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="rounded bg-amber px-4 py-1.5 text-xs font-medium text-navy transition-colors hover:bg-amber-dark"
              >
                Register
              </Link>
            </div>
          )}

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/60 lg:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-expanded={drawerOpen}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {drawerOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="fixed inset-y-0 left-0 z-[70] flex w-[min(100%,320px)] flex-col border-r border-white/8 bg-navy shadow-2xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <Link href="/" onClick={() => setDrawerOpen(false)}>
                <Logo variant="nav" size="sm" />
              </Link>
              <button
                type="button"
                className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-6 pt-2">
              <MegaMenuDrawerSection onNavigate={() => setDrawerOpen(false)} />
              <Link
                href="/sales/lots"
                className="flex items-center justify-between border-b border-white/10 px-3 py-3 text-base font-medium text-amber"
                onClick={() => setDrawerOpen(false)}
              >
                🔥 Lot Sales
                <ChevronRight className="h-4 w-4 text-white/40" />
              </Link>
              <Link
                href="/asas/listings"
                className="flex items-center justify-between border-b border-white/10 px-3 py-3 text-base font-medium text-asas/90"
                onClick={() => setDrawerOpen(false)}
              >
                AsAs Deals
                <ChevronRight className="h-4 w-4 text-white/40" />
              </Link>
              <Link
                href="/about"
                className="flex items-center justify-between border-b border-white/10 px-3 py-3 text-base font-medium text-white/80"
                onClick={() => setDrawerOpen(false)}
              >
                About
                <ChevronRight className="h-4 w-4 text-white/40" />
              </Link>

              <div className="mt-4 px-2">
                <ProductSearchPalette compact className="w-full" />
              </div>
            </div>
            {!session?.user ? (
              <div className="mt-auto space-y-2 border-t border-white/10 p-4">
                <Link
                  href="/auth/login"
                  className="block w-full rounded-lg border border-white/15 py-3 text-center text-sm font-semibold text-white"
                  onClick={() => setDrawerOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="block w-full rounded-lg bg-amber py-3 text-center text-sm font-semibold text-navy"
                  onClick={() => setDrawerOpen(false)}
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="mt-auto border-t border-white/10 p-4">
                <div className="flex items-center justify-between gap-2">
                  {session.user.role === "CUSTOMER" ? (
                    <CustomerLiveNotificationBell className="h-10 w-10 rounded-lg border-0 bg-white/10 text-white/70 hover:bg-white/15 hover:text-white" />
                  ) : (
                    <span />
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white"
                      >
                        {userInitials(session.user.name, session.user.email)}
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
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}
    </header>
  );
}
