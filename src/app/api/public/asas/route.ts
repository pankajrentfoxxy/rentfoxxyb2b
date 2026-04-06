import { asasInventoryCap, asasUnitsAvailable } from "@/lib/asas-inventory";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const listings = await prisma.asAsListing.findMany({
      where: { status: "LIVE" },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        items: { select: { brand: true, condition: true, count: true } },
      },
    });
    const publicListings = listings.map((l) => {
      const cap = asasInventoryCap(l, l.items);
      return {
        id: l.id,
        title: l.title,
        description: l.description,
        highlights: l.highlights,
        totalUnits: cap,
        unitsAvailable: asasUnitsAvailable(l, l.items),
        avgUnitPrice: l.avgUnitPrice,
        allowBidding: l.allowBidding,
        brands: Array.from(new Set(l.items.map((i) => i.brand))).slice(0, 3),
        conditions: Array.from(new Set(l.items.map((i) => i.condition))),
      };
    });
    return NextResponse.json({ listings: publicListings });
  } catch {
    return NextResponse.json({ listings: [] });
  }
}
