import { AsAsCard } from "@/components/storefront/AsAsCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import {
  asasInventoryCap,
  asasPublicLotProgress,
  asasUnitsAvailableFromPurchases,
  asasUnitsSoldFromPurchases,
} from "@/lib/asas-inventory";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export async function HomeAsAsDeals() {
  let rows;
  try {
    rows = await prisma.asAsListing.findMany({
      where: { status: "LIVE" },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        items: { select: { brand: true, condition: true, count: true } },
        purchases: { select: { quantity: true, status: true } },
      },
    });
  } catch {
    return null;
  }
  if (!rows.length) return null;

  return (
    <section className="bg-asas-bg/30 py-6 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel color="asas">🔄 AsAs Deals</SectionLabel>
            <h2 className="mt-1.5 text-[17px] font-medium text-ink-primary">Fleet Clearance</h2>
            <p className="text-[13px] text-ink-muted">As-available, as-is mixed inventory</p>
          </div>
          <Link href="/asas/listings" className="text-sm text-asas hover:underline">
            See all →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((l) => {
            const brands = Array.from(new Set(l.items.map((i) => i.brand))).slice(0, 3);
            const conditions = Array.from(new Set(l.items.map((i) => i.condition)));
            const cap = asasInventoryCap(l, l.items);
            const unitsSold = asasUnitsSoldFromPurchases(l.purchases);
            const unitsAvailable = asasUnitsAvailableFromPurchases(l, l.items, l.purchases);
            const lot = asasPublicLotProgress(l, cap, unitsSold);
            return (
              <AsAsCard
                key={l.id}
                id={l.id}
                title={l.title}
                description={l.description}
                brands={brands}
                conditions={conditions}
                unitsAvailable={unitsAvailable}
                avgUnitPrice={l.avgUnitPrice}
                allowBidding={l.allowBidding}
                isLotMode={lot.isLotMode}
                totalLots={lot.totalLots}
                lotsSold={lot.lotsSold}
                lotsRemaining={lot.lotsRemaining}
                lotSize={lot.lotSize}
                percentSold={lot.percentSold}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
