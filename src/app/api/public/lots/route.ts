import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const lots = await prisma.lotListing.findMany({
      where: { status: "LIVE" },
      orderBy: [{ lotsSold: "desc" }, { createdAt: "desc" }],
      take: 4,
      include: {
        items: { select: { brand: true, condition: true, count: true } },
      },
    });
    const publicLots = lots.map((lot) => ({
      id: lot.id,
      title: lot.title,
      coverImage: lot.coverImage,
      totalLots: lot.totalLots,
      lotsSold: lot.lotsSold,
      lotsRemaining: lot.totalLots - lot.lotsSold,
      lotSize: lot.lotSize,
      pricePerLot: lot.pricePerLot,
      brands: Array.from(new Set(lot.items.map((i) => i.brand))).slice(0, 3),
      conditions: Array.from(new Set(lot.items.map((i) => i.condition))),
      percentSold: lot.totalLots > 0 ? Math.round((lot.lotsSold / lot.totalLots) * 100) : 0,
    }));
    return NextResponse.json({ lots: publicLots });
  } catch {
    return NextResponse.json({ lots: [] });
  }
}
