import { getVendorContext } from "@/lib/vendor-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getVendorContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  const myListings = await prisma.productListing.findMany({
    where: { vendorId: ctx.vendorId, isActive: true },
    include: {
      product: { select: { id: true, name: true, slug: true } },
      bids: { where: { createdAt: { gte: thirtyDaysAgo } }, take: 50 },
      _count: { select: { bids: true, orderItems: true } },
    },
  });

  const marketPrices = await Promise.all(
    myListings.map(async (listing) => {
      const [agg, totalCount] = await Promise.all([
        prisma.productListing.aggregate({
          where: { productId: listing.productId, isActive: true },
          _min: { unitPrice: true },
          _max: { unitPrice: true },
          _avg: { unitPrice: true },
        }),
        prisma.productListing.count({ where: { productId: listing.productId, isActive: true } }),
      ]);
      const avg = agg._avg.unitPrice ?? 0;
      const priceDiffPct =
        avg > 0 ? Math.round(((listing.unitPrice - avg) / avg) * 100) : 0;
      return {
        listingId: listing.id,
        productName: listing.product.name,
        myPrice: listing.unitPrice,
        marketMin: agg._min.unitPrice,
        marketMax: agg._max.unitPrice,
        marketAvg: agg._avg.unitPrice,
        competitorCount: Math.max(0, totalCount - 1),
        priceDiffFromAvg: listing.unitPrice - avg,
        priceDiffPct,
      };
    }),
  );

  const watchCount = await Promise.all(
    myListings.map(async (listing) => {
      const count = await prisma.priceWatch.count({
        where: { productId: listing.productId, isActive: true },
      });
      return { listingId: listing.id, watchCount: count };
    }),
  );

  const bidGaps = await Promise.all(
    myListings.map(async (listing) => {
      const bids = await prisma.bid.findMany({
        where: { listingId: listing.id, status: { not: "CANCELLED" } },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      const avgBidPrice =
        bids.length > 0 ? bids.reduce((s, b) => s + b.bidPricePerUnit, 0) / bids.length : null;
      return {
        listingId: listing.id,
        avgBidPrice,
        minBidPrice: listing.minBidPrice,
        gap: avgBidPrice != null ? avgBidPrice - listing.minBidPrice : null,
      };
    }),
  );

  const stockAge = myListings.map((l) => ({
    listingId: l.id,
    daysListed: Math.floor((Date.now() - l.createdAt.getTime()) / 86400000),
    totalSales: l._count.orderItems,
  }));

  const myProductIds = new Set(myListings.map((l) => l.productId));
  const grouped = await prisma.priceWatch.groupBy({
    by: ["productId"],
    where: { isActive: true },
    _count: { _all: true },
    orderBy: { _count: { productId: "desc" } },
    take: 25,
  });

  const demandSignals: { productId: string; name: string; watchers: number }[] = [];
  for (const g of grouped) {
    if (myProductIds.has(g.productId)) continue;
    const p = await prisma.product.findFirst({
      where: { id: g.productId, isActive: true },
      select: { name: true },
    });
    if (p) {
      demandSignals.push({
        productId: g.productId,
        name: p.name,
        watchers: g._count._all,
      });
    }
    if (demandSignals.length >= 8) break;
  }

  return NextResponse.json({
    myListings,
    marketPrices,
    watchCount,
    bidGaps,
    stockAge,
    demandSignals,
  });
}
