import { getBuyerBadge, tierRank } from "@/lib/buyer-badge";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function tierGateRank(minimum: string | null | undefined): number | null {
  if (!minimum) return null;
  if (minimum === "GOLD") return tierRank("GOLD");
  if (minimum === "SILVER") return tierRank("SILVER");
  return null;
}

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

  const need = tierGateRank(lot.minimumBuyerTier);
  if (need != null) {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "AUTH_REQUIRED",
          message: "Sign in to view this lot.",
          minimumBuyerTier: lot.minimumBuyerTier,
        },
        { status: 403 },
      );
    }
    const profile = await prisma.customerProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!profile || session.user.role !== "CUSTOMER") {
      return NextResponse.json(
        {
          error: "CUSTOMER_REQUIRED",
          message: "This lot is restricted to verified buyer accounts.",
          minimumBuyerTier: lot.minimumBuyerTier,
        },
        { status: 403 },
      );
    }
    const badge = await getBuyerBadge(profile.id);
    if (tierRank(badge.tier) < need) {
      return NextResponse.json(
        {
          error: "TIER_REQUIRED",
          message: `This lot requires ${lot.minimumBuyerTier} buyer status or higher.`,
          minimumBuyerTier: lot.minimumBuyerTier,
        },
        { status: 403 },
      );
    }
  }

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
    minimumBuyerTier: lot.minimumBuyerTier,
    inspectorVerified: lot.inspectorVerified,
    hasUploadedCsv: Boolean(lot.uploadedCsvSnapshot?.trim()),
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
