import { LotCard } from "@/components/storefront/LotCard";
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
      take: 4,
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
    <section className="border-b border-slate-100 bg-gradient-to-b from-orange-50/40 to-white py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Hot Lot Sales</h2>
            <p className="mt-1 text-sm text-muted">Verified bulk laptops — mixed brands and grades</p>
          </div>
          <Link href="/sales/lots" className="text-sm font-semibold text-accent hover:underline">
            See all →
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {lots.map((l) => {
            const brands = Array.from(new Set(l.items.map((i) => i.brand))).slice(0, 3);
            const conditions = Array.from(new Set(l.items.map((i) => i.condition)));
            const percentSold = l.totalLots > 0 ? Math.round((l.lotsSold / l.totalLots) * 100) : 0;
            return (
              <LotCard
                key={l.id}
                id={l.id}
                title={l.title}
                coverImage={l.coverImage}
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
