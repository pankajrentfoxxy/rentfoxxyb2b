import { AsAsCard } from "@/components/storefront/AsAsCard";
import { asasUnitsAvailable } from "@/lib/asas-inventory";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export async function HomeAsAsDeals() {
  let rows;
  try {
    rows = await prisma.asAsListing.findMany({
      where: { status: "LIVE" },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        items: { select: { brand: true, condition: true, count: true } },
      },
    });
  } catch {
    return null;
  }
  if (rows.length === 0) return null;

  return (
    <section className="border-b border-slate-100 bg-slate-50/80 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">AsAs Deals</h2>
            <p className="mt-1 text-sm text-muted">As-available-as-is mixed fleet clearance</p>
          </div>
          <Link href="/asas/listings" className="text-sm font-semibold text-accent hover:underline">
            Browse all →
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((l) => {
            const brands = Array.from(new Set(l.items.map((i) => i.brand))).slice(0, 3);
            const conditions = Array.from(new Set(l.items.map((i) => i.condition)));
            return (
              <AsAsCard
                key={l.id}
                id={l.id}
                title={l.title}
                description={l.description}
                brands={brands}
                conditions={conditions}
                unitsAvailable={asasUnitsAvailable(l, l.items)}
                avgUnitPrice={l.avgUnitPrice}
                allowBidding={l.allowBidding}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
