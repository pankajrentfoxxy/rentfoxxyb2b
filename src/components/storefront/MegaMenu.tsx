"use client";

import { ChevronDown, HardDrive, Laptop, Package, Tag } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const MENU_DATA = {
  laptops: {
    heading: "Laptops",
    Icon: Laptop,
    links: [
      { label: "Business Laptops", href: "/products?category=business" },
      { label: "Gaming Laptops", href: "/products?category=gaming" },
      { label: "Thin & Light", href: "/products?category=thin-light" },
      { label: "Budget Laptops", href: "/products?category=budget" },
    ],
    subSection: {
      heading: "Shop by Brand",
      links: [
        { label: "Dell", href: "/products?brand=Dell" },
        { label: "HP", href: "/products?brand=HP" },
        { label: "Lenovo", href: "/products?brand=Lenovo" },
        { label: "Apple", href: "/products?brand=Apple" },
        { label: "Acer", href: "/products?brand=Acer" },
        { label: "ASUS", href: "/products?brand=ASUS" },
      ],
    },
  },
  accessories: {
    heading: "Accessories",
    Icon: Package,
    links: [
      { label: "Keyboards", href: "/products?category=keyboards" },
      { label: "Mice", href: "/products?category=mice" },
      { label: "Laptop Bags", href: "/products?category=bags" },
      { label: "Docking Stations", href: "/products?category=docking" },
      { label: "Cables & Adapters", href: "/products?category=cables" },
    ],
    subSection: {
      heading: "Networking",
      links: [
        { label: "Switches", href: "/products?category=switches" },
        { label: "Routers", href: "/products?category=routers" },
        { label: "Adapters", href: "/products?category=adapters" },
      ],
    },
  },
  storage: {
    heading: "Storage & More",
    Icon: HardDrive,
    links: [
      { label: "External SSDs", href: "/products?category=external-ssd" },
      { label: "Hard Drives", href: "/products?category=hard-drives" },
      { label: "USB Drives", href: "/products?category=usb" },
      { label: "Memory Cards", href: "/products?category=memory" },
    ],
    subSection: {
      heading: "Shop by Grade",
      links: [
        { label: "Brand New", href: "/products?condition=BRAND_NEW" },
        { label: "Refurb A+", href: "/products?condition=REFURB_A_PLUS" },
        { label: "Refurb A", href: "/products?condition=REFURB_A" },
        { label: "Refurb B", href: "/products?condition=REFURB_B" },
      ],
    },
  },
} as const;

const PROMO_CARDS = [
  {
    title: "Business Laptops",
    subtitle: "Bulk orders welcome",
    href: "/products?category=business",
    bg: "from-primary/10 to-accent/10",
    icon: "💼" as const,
  },
  {
    title: "Lot Sales",
    subtitle: "Bulk lots at deep discounts",
    href: "/sales/lots",
    bg: "from-orange-50 to-red-50",
    icon: "📦" as const,
  },
  {
    title: "AsAs Deals",
    subtitle: "Mixed fleet clearance",
    href: "/asas/listings",
    bg: "from-purple-50 to-indigo-50",
    icon: "🔄" as const,
  },
];

export function MegaMenuDrawerSection({ onNavigate }: { onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-base font-medium text-slate-800"
      >
        <span className="inline-flex items-center gap-2">
          <Tag className="h-4 w-4 text-accent" />
          Products
        </span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="space-y-4 px-3 pb-4">
          {Object.values(MENU_DATA).map((col) => (
            <div key={col.heading}>
              <p className="mb-2 text-xs font-bold uppercase text-muted">{col.heading}</p>
              <ul className="space-y-1">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block rounded-lg py-2 text-sm text-primary hover:bg-surface"
                      onClick={onNavigate}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                {col.subSection.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block rounded-lg py-2 text-sm text-slate-700 hover:bg-surface"
                      onClick={onNavigate}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {PROMO_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              onClick={onNavigate}
              className={`block rounded-xl border border-slate-200 bg-gradient-to-br ${card.bg} p-3`}
            >
              <p className="text-sm font-bold text-primary">
                {card.icon} {card.title}
              </p>
              <p className="text-xs text-muted">{card.subtitle}</p>
            </Link>
          ))}
          <Link
            href="/products"
            onClick={onNavigate}
            className="block text-center text-sm font-bold text-accent"
          >
            View all products →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function MegaMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setIsOpen(true);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setIsOpen(false), 150);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="relative hidden lg:block" onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
      <button
        type="button"
        className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isOpen ? "bg-accent/10 text-accent" : "text-slate-700 hover:bg-accent/5 hover:text-accent"
        }`}
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Products
        <ChevronDown className={`h-4 w-4 transition duration-200 ${isOpen ? "rotate-180 text-accent" : ""}`} />
      </button>
      {isOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 top-16 z-40 bg-black/20 lg:block"
            aria-label="Close menu"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="mega-menu-panel absolute left-0 top-full z-50 mt-1 max-h-[calc(100vh-5rem)] w-[min(900px,calc(100vw-2rem))] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onMouseEnter={openMenu}
            onMouseLeave={scheduleClose}
          >
            <div className="grid grid-cols-[1fr_1fr_1fr_1.4fr] divide-x divide-slate-100">
              {Object.values(MENU_DATA).map((col) => (
                <div key={col.heading} className="p-5">
                  <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                    <col.Icon className="h-3.5 w-3.5" />
                    {col.heading}
                  </p>
                  <ul className="mb-4 space-y-1">
                    {col.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className="block rounded-lg px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-accent/5 hover:text-accent"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="mb-2 border-t border-slate-100 pt-3 text-xs font-bold uppercase tracking-wider text-muted">
                    {col.subSection.heading}
                  </p>
                  <ul className="space-y-1">
                    {col.subSection.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className="block rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-accent/5 hover:text-accent"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="bg-slate-50 p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-primary">Featured</p>
                <div className="space-y-3">
                  {PROMO_CARDS.map((card) => (
                    <Link
                      key={card.href}
                      href={card.href}
                      onClick={() => setIsOpen(false)}
                      className={`block rounded-xl border border-slate-200 bg-gradient-to-br ${card.bg} p-3 transition-all hover:border-slate-300 hover:shadow-md`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{card.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-primary">{card.title}</p>
                          <p className="text-xs text-muted">{card.subtitle}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-accent">See more →</p>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/products"
                  onClick={() => setIsOpen(false)}
                  className="mt-4 block py-2 text-center text-xs font-bold text-accent hover:underline"
                >
                  View all products →
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
