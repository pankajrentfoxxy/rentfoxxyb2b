import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lot = await prisma.lotListing.findFirst({
    where: { id, status: "LIVE" },
    include: {
      items: { orderBy: [{ brand: "asc" }, { condition: "asc" }] },
      purchases: { select: { lotsCount: true, createdAt: true }, take: 20 },
    },
  });

  if (!lot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const totalUnits = lot.items.reduce((s, i) => s + i.count, 0);
  const lotsRemaining = lot.totalLots - lot.lotsSold;
  const percentSold =
    lot.totalLots > 0 ? Math.round((lot.lotsSold / lot.totalLots) * 100) : 0;

  const brandBreakdown = Object.entries(
    lot.items.reduce<Record<string, number>>((acc, item) => {
      acc[item.brand] = (acc[item.brand] ?? 0) + item.count;
      return acc;
    }, {}),
  )
    .map(([brand, count]) => ({
      brand,
      count,
      pct: totalUnits > 0 ? Math.round((count / totalUnits) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const conditionBreakdown = Object.entries(
    lot.items.reduce<Record<string, number>>((acc, item) => {
      const k = item.condition;
      acc[k] = (acc[k] ?? 0) + item.count;
      return acc;
    }, {}),
  ).map(([condition, count]) => ({
    condition,
    count,
    pct: totalUnits > 0 ? Math.round((count / totalUnits) * 100) : 0,
  }));

  const unitsPerLot = lot.lotSize;
  const lotComposition = lot.items
    .map((item) => ({
      ...item,
      unitsInOneLot:
        totalUnits > 0 ? Math.round((item.count / totalUnits) * unitsPerLot) : 0,
    }))
    .filter((i) => i.unitsInOneLot > 0);

  return NextResponse.json({
    id: lot.id,
    title: lot.title,
    description: lot.description,
    coverImage: lot.coverImage,
    totalLots: lot.totalLots,
    lotsSold: lot.lotsSold,
    lotsRemaining,
    lotSize: lot.lotSize,
    pricePerLot: lot.pricePerLot,
    totalUnits,
    percentSold,
    items: lot.items,
    brandBreakdown,
    conditionBreakdown,
    lotComposition,
    recentPurchases: lot.purchases.length,
  });
}
