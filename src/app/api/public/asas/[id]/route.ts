import { asasInventoryCap, asasUnitsAvailable } from "@/lib/asas-inventory";
import { prisma } from "@/lib/prisma";
import type { LotItemCondition } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await prisma.asAsListing.findFirst({
    where: { id, status: "LIVE" },
    include: {
      items: { orderBy: [{ brand: "asc" }, { model: "asc" }] },
    },
  });

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cap = asasInventoryCap(listing, listing.items);
  const unitsAvailable = asasUnitsAvailable(listing, listing.items);
  const brands = Array.from(new Set(listing.items.map((i) => i.brand))).sort();
  const conditions = Array.from(new Set(listing.items.map((i) => i.condition))).sort() as LotItemCondition[];

  const pivot = brands.map((brand) => {
    const row: Record<string, number | string> = { brand, total: 0 };
    for (const cond of conditions) {
      const n = listing.items
        .filter((i) => i.brand === brand && i.condition === cond)
        .reduce((s, i) => s + i.count, 0);
      row[cond] = n;
      row.total = (row.total as number) + n;
    }
    return row;
  });

  return NextResponse.json({
    id: listing.id,
    title: listing.title,
    description: listing.description,
    highlights: listing.highlights,
    totalUnits: cap,
    unitsAvailable,
    avgUnitPrice: listing.avgUnitPrice,
    allowBidding: listing.allowBidding,
    allowMultiBuyer: listing.allowMultiBuyer,
    aiSuggestedLots: listing.aiSuggestedLots,
    items: listing.items,
    pivot,
    pivotConditions: conditions,
  });
}
