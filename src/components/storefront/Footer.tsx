import Logo from "@/components/ui/Logo";
import { PLACEHOLDER_GSTIN, TAGLINE } from "@/constants";
import { Globe, Mail, Share2 } from "lucide-react";
import Link from "next/link";

const linkCols = [
  {
    title: "Products",
    links: [
      { href: "/products", label: "Catalog" },
      { href: "/products?type=laptops", label: "Laptops" },
      { href: "/products?type=accessories", label: "Accessories" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/auth/login", label: "Log in" },
      { href: "/auth/register", label: "Register" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/refunds", label: "Refunds" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/contact", label: "Help center" },
      { href: "/contact", label: "Bulk / enterprise" },
      { href: "/contact", label: "Report issue" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/">
              <Logo size="md" variant="light" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-300">{TAGLINE}</p>
          </div>
          {linkCols.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-300 transition hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            GSTIN {PLACEHOLDER_GSTIN} · © {new Date().getFullYear()} Rentfoxxy Technology Pvt. Ltd.
          </p>
          <div className="flex items-center gap-4">
            <Link href="https://twitter.com" aria-label="Social" className="text-slate-400 hover:text-white">
              <Share2 className="h-5 w-5" />
            </Link>
            <Link href="https://rentfoxxy.com" aria-label="Website" className="text-slate-400 hover:text-white">
              <Globe className="h-5 w-5" />
            </Link>
            <Link href="mailto:support@rentfoxxy.com" aria-label="Email" className="text-slate-400 hover:text-white">
              <Mail className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
