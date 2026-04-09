import {
  asasInventoryCap,
  asasPublicLotProgress,
  asasUnitsAvailableFromPurchases,
  asasUnitsSoldFromPurchases,
} from "@/lib/asas-inventory";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const listings = await prisma.asAsListing.findMany({
      where: { status: "LIVE" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        items: { select: { brand: true, condition: true, count: true } },
        purchases: { select: { quantity: true, status: true } },
      },
    });
    const publicListings = listings.map((l) => {
      const cap = asasInventoryCap(l, l.items);
      const unitsSold = asasUnitsSoldFromPurchases(l.purchases);
      const unitsAvailable = asasUnitsAvailableFromPurchases(l, l.items, l.purchases);
      const lot = asasPublicLotProgress(l, cap, unitsSold);
      return {
        id: l.id,
        title: l.title,
        description: l.description,
        highlights: l.highlights,
        totalUnits: cap,
        unitsSold,
        unitsAvailable,
        avgUnitPrice: l.avgUnitPrice,
        allowBidding: l.allowBidding,
        allowMultiBuyer: l.allowMultiBuyer,
        aiSuggestedLots: l.aiSuggestedLots,
        brands: Array.from(new Set(l.items.map((i) => i.brand))).slice(0, 3),
        conditions: Array.from(new Set(l.items.map((i) => i.condition))),
        isLotMode: lot.isLotMode,
        lotSize: lot.lotSize,
        totalLots: lot.totalLots,
        lotsSold: lot.lotsSold,
        lotsRemaining: lot.lotsRemaining,
        percentSold: lot.percentSold,
      };
    });
    return NextResponse.json({ listings: publicListings });
  } catch {
    return NextResponse.json({ listings: [] });
  }
}
