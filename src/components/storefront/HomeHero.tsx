import { BTN } from "@/constants/design";
import { ConditionBadge } from "@/components/ui/ConditionBadge";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { LotProgress } from "@/components/ui/StatBadge";
import Link from "next/link";

export function HomeHero() {
  return (
    <section className="bg-gradient-to-br from-navy via-navy to-[#0F2040] px-4 py-12">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <SectionLabel color="verified">Inspection-Certified Inventory</SectionLabel>
          <h1 className="mb-3 mt-3 text-[32px] font-medium leading-[1.2] text-white lg:text-[36px]">
            India&apos;s verified B2B laptop marketplace.
          </h1>
          <p className="mb-5 text-xl font-medium text-amber">Compare. Negotiate. Buy.</p>
          <p className="mb-5 max-w-[440px] text-[13px] leading-[1.75] text-white/50">
            Source from verified vendors with transparent grading, structured bids, and GST-ready invoicing —
            built for procurement teams who need speed without sacrificing control.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/products" className={`inline-flex text-center ${BTN.primary}`}>
              Browse Products
            </Link>
            <Link
              href="/sales/lots"
              className="inline-flex rounded-lg border border-white/12 bg-white/[0.06] px-5 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10"
            >
              View Lot Sales
            </Link>
          </div>
          <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
            <div className="grid grid-cols-2 divide-x divide-white/10 sm:grid-cols-4">
              {[
                { n: "500+", l: "Enterprises" },
                { n: "50+", l: "Vendors" },
                { n: "100%", l: "GST" },
                { n: "₹0", l: "Hidden fees" },
              ].map((cell) => (
                <div key={cell.l} className="px-4 py-3 text-center">
                  <p className="text-lg font-medium text-amber">{cell.n}</p>
                  <p className="mt-0.5 text-[10px] text-white/35">{cell.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="rounded-xl border border-white/10 border-l-[3px] border-l-amber bg-navy-light p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[9px] font-medium uppercase tracking-widest text-white/35">🔥 Hot lot</span>
              <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[9px] text-red-300">Urgent</span>
            </div>
            <p className="mb-2 text-[13px] font-medium leading-snug text-white">
              Dell & Lenovo business fleet — mixed A / A+ refurb
            </p>
            <div className="mb-2 flex flex-wrap gap-1">
              <ConditionBadge condition="REFURB_A_PLUS" size="sm" />
              <ConditionBadge condition="REFURB_A" size="sm" />
            </div>
            <LotProgress sold={8} total={20} />
            <div className="mt-3 flex items-center justify-between">
              <span className="font-medium text-amber">From ₹4,85,000 / lot</span>
              <Link href="/sales/lots" className={`${BTN.primary} px-3 py-1.5 text-xs`}>
                Buy
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 border-l-[3px] border-l-asas bg-navy-light p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[9px] font-medium uppercase tracking-widest text-white/35">🔄 AsAs deal</span>
              <span className="rounded bg-asas/15 px-1.5 py-0.5 text-[9px] text-asas-border">Bid open</span>
            </div>
            <p className="mb-1 text-[13px] font-medium text-white">Mixed HP & Acer — warehouse clearance</p>
            <p className="mb-3 text-[11px] text-white/35">Brands: HP · Acer · ASUS</p>
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-asas-border">Avg ₹18,400 / unit</span>
              <div className="flex gap-1">
                <Link href="/asas/listings" className={`${BTN.asas} px-2 py-1 text-[10px]`}>
                  Bid
                </Link>
                <Link
                  href="/asas/listings"
                  className="rounded border border-asas/40 px-2 py-1 text-[10px] text-white/90 hover:bg-asas/20"
                >
                  Buy
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.04] p-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-verified/20 text-sm text-verified">
              ✓
            </div>
            <div>
              <p className="text-[11px] font-medium text-white/70">Physical verification on every refurb lot</p>
              <p className="text-[10px] text-white/30">Our team visits vendor warehouse before listing goes live</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
