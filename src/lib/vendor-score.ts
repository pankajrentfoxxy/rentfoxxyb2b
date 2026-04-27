import { prisma } from "@/lib/prisma";

const EXCLUDE_FROM_TOTAL = new Set(["PAYMENT_PENDING", "CANCELLED"]);

const DISPATCHED_STATUSES = new Set([
  "DISPATCHED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELIVERY_CONFIRMED",
  "PAYOUT_PENDING",
  "PAYOUT_RELEASED",
]);

const DISPUTED_STATUSES = new Set(["RETURN_REQUESTED", "REFUNDED"]);

export function getScoreLabel(score: number | null | undefined): string {
  if (score == null || score === 0) return "New Supplier";
  if (score >= 90) return "Top Rated";
  if (score >= 75) return "Highly Reliable";
  if (score >= 60) return "Reliable";
  return "Verified";
}

/** Storefront/API: expose performance only (no vendor identity). */
export function listingPerformanceFields(row: {
  vendorScoreSnapshot: number | null;
  vendor: { vendorScore: { overallScore: number } | null };
}) {
  const raw = row.vendor?.vendorScore?.overallScore ?? row.vendorScoreSnapshot ?? null;
  const performanceScore = raw != null && raw > 0 ? raw : null;
  return {
    performanceScore,
    scoreLabel: getScoreLabel(performanceScore ?? 0),
  };
}

/** Addendum v1.9 P1 — compute and persist vendor score + listing snapshots. */
export async function computeVendorScore(vendorId: string): Promise<number> {
  const listingIds = await prisma.productListing.findMany({
    where: { vendorId },
    select: { id: true },
  });
  const ids = listingIds.map((l) => l.id);
  if (ids.length === 0) {
    await prisma.vendorScore.upsert({
      where: { vendorId },
      create: { vendorId, overallScore: 0, lastComputedAt: new Date() },
      update: { overallScore: 0, lastComputedAt: new Date() },
    });
    return 0;
  }

  const orderRows = await prisma.order.findMany({
    where: {
      items: { some: { listingId: { in: ids } } },
    },
    distinct: ["id"],
    select: {
      id: true,
      status: true,
      createdAt: true,
      shipment: { select: { dispatchedAt: true } },
    },
  });

  const orders = orderRows.filter((o) => !EXCLUDE_FROM_TOTAL.has(o.status));
  const totalOrders = orders.length;
  if (totalOrders === 0) {
    await prisma.vendorScore.upsert({
      where: { vendorId },
      create: {
        vendorId,
        overallScore: 0,
        deliveryScore: 0,
        fulfillmentScore: 0,
        reviewScore: 0,
        disputeScore: 0,
        totalOrders: 0,
        onTimeDeliveries: 0,
        disputedOrders: 0,
        lastComputedAt: new Date(),
      },
      update: {
        overallScore: 0,
        deliveryScore: 0,
        fulfillmentScore: 0,
        reviewScore: 0,
        disputeScore: 0,
        totalOrders: 0,
        onTimeDeliveries: 0,
        disputedOrders: 0,
        lastComputedAt: new Date(),
      },
    });
    await prisma.productListing.updateMany({
      where: { vendorId },
      data: { vendorScoreSnapshot: 0 },
    });
    return 0;
  }

  const dispatched = orders.filter((o) => DISPATCHED_STATUSES.has(o.status));
  const deliveryScore = Math.round((dispatched.length / totalOrders) * 100);

  const disputed = orders.filter((o) => DISPUTED_STATUSES.has(o.status));
  const disputedOrders = disputed.length;
  const fulfillmentScore = Math.round(((totalOrders - disputedOrders) / totalOrders) * 100);

  let onTimeDeliveries = 0;
  for (const o of dispatched) {
    const disp = o.shipment?.dispatchedAt;
    if (!disp) {
      onTimeDeliveries++;
      continue;
    }
    const deadline = new Date(o.createdAt.getTime() + 48 * 3600 * 1000);
    if (disp <= deadline) onTimeDeliveries++;
  }

  const reviews = await prisma.review.findMany({
    where: { subjectId: vendorId, type: "CUSTOMER_EXPERIENCE" },
    select: { rating: true },
  });
  const avgRating =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const reviewScore = Math.round(avgRating * 20);

  const disputeScore = Math.max(0, 100 - Math.round((disputedOrders / totalOrders) * 100));

  const overall = Math.round(deliveryScore * 0.35 + fulfillmentScore * 0.35 + reviewScore * 0.3);

  await prisma.vendorScore.upsert({
    where: { vendorId },
    create: {
      vendorId,
      overallScore: overall,
      deliveryScore,
      fulfillmentScore,
      reviewScore,
      disputeScore,
      totalOrders,
      onTimeDeliveries,
      disputedOrders,
      lastComputedAt: new Date(),
    },
    update: {
      overallScore: overall,
      deliveryScore,
      fulfillmentScore,
      reviewScore,
      disputeScore,
      totalOrders,
      onTimeDeliveries,
      disputedOrders,
      lastComputedAt: new Date(),
    },
  });

  await prisma.productListing.updateMany({
    where: { vendorId },
    data: { vendorScoreSnapshot: overall },
  });

  return overall;
}

export async function computeAllVendorScores(): Promise<{ recomputed: number }> {
  const vendors = await prisma.vendorProfile.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });
  for (const v of vendors) {
    await computeVendorScore(v.id);
  }
  return { recomputed: vendors.length };
}
