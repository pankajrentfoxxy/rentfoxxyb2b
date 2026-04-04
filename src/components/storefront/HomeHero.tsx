import Link from "next/link";
import { BadgeCheck, Building2, Package, Shield } from "lucide-react";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-light to-accent">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:px-6 lg:py-24">
        <div className="relative z-10 flex flex-col justify-center text-white">
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            India&apos;s trusted B2B laptop procurement platform
          </h1>
          <p className="mt-4 max-w-xl text-lg text-blue-100">
            Source laptops and accessories from verified suppliers. Compare prices, negotiate deals,
            and track delivery — all under the Rentfoxxy brand.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/products"
              className="inline-flex h-12 items-center rounded-lg bg-white px-6 text-sm font-semibold text-primary shadow-lg transition hover:bg-slate-100"
            >
              Browse products
            </Link>
            <Link
              href="/auth/register?intent=buyer"
              className="inline-flex h-12 items-center rounded-lg border-2 border-white/60 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Get a custom quote
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-3 text-sm font-medium text-blue-100">
            {[
              { icon: Building2, label: "500+ enterprises" },
              { icon: BadgeCheck, label: "GST invoicing" },
              { icon: Shield, label: "Verified vendors" },
              { icon: Package, label: "Pan-India delivery" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur"
              >
                <Icon className="h-4 w-4 text-fox" aria-hidden />
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="relative hidden min-h-[280px] md:flex md:items-center md:justify-center">
          <div className="relative h-64 w-full max-w-md">
            <div className="absolute inset-0 rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur" />
            <div className="absolute left-6 top-8 h-36 w-52 rounded-lg border-4 border-white/30 bg-slate-900/40 shadow-inner" />
            <div className="absolute bottom-10 right-8 h-20 w-32 rounded-md bg-accent/90 shadow-lg" />
            <div className="absolute right-12 top-14 h-3 w-24 rounded bg-fox/90" />
          </div>
        </div>
      </div>
    </section>
  );
}
