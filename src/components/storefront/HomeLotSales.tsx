import { LotCard } from "@/components/storefront/LotCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export async function HomeLotSales() {
  let lots: Awaited<
    ReturnType<
      typeof prisma.lotListing.findMany<{
        include: { items: { select: { brand: true; condition: true } } };
      }>
    >
  >;
  try {
    lots = await prisma.lotListing.findMany({
      where: { status: "LIVE" },
      take: 8,
      orderBy: [{ lotsSold: "desc" }, { createdAt: "desc" }],
      include: {
        items: { select: { brand: true, condition: true } },
      },
    });
  } catch {
    return null;
  }
  if (lots.length === 0) return null;

  return (
    <section className="bg-white py-6 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel color="amber">🔥 Hot Lot Sales</SectionLabel>
            <h2 className="mt-1.5 text-[17px] font-medium text-ink-primary">Bulk verified inventory</h2>
            <p className="text-[13px] text-ink-muted">Mixed brands and grades — priced per lot</p>
          </div>
          <Link href="/sales/lots" className="text-sm text-lot hover:underline">
            See all lot sales →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lots.map((l) => {
            const brands = Array.from(new Set(l.items.map((i) => i.brand))).slice(0, 3);
            const conditions = Array.from(new Set(l.items.map((i) => i.condition)));
            const percentSold = l.totalLots > 0 ? Math.round((l.lotsSold / l.totalLots) * 100) : 0;
            return (
              <LotCard
                key={l.id}
                id={l.id}
                title={l.title}
                description={l.description}
                brands={brands}
                conditions={conditions}
                totalLots={l.totalLots}
                lotsSold={l.lotsSold}
                lotsRemaining={l.totalLots - l.lotsSold}
                lotSize={l.lotSize}
                pricePerLot={l.pricePerLot}
                percentSold={percentSold}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
