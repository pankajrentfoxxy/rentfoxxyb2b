import { prisma } from "@/lib/prisma";

export async function recomputeVendorReviewStats(vendorProfileId: string) {
  const agg = await prisma.review.aggregate({
    where: { type: "CUSTOMER_EXPERIENCE", subjectId: vendorProfileId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.vendorProfile.update({
    where: { id: vendorProfileId },
    data: {
      avgRating: agg._avg.rating ?? 0,
      reviewCount: agg._count._all,
    },
  });
}

export async function recomputeCustomerReviewStats(customerProfileId: string) {
  const agg = await prisma.review.aggregate({
    where: { type: "VENDOR_CUSTOMER", subjectId: customerProfileId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.customerProfile.update({
    where: { id: customerProfileId },
    data: {
      avgRating: agg._avg.rating ?? 0,
      reviewCount: agg._count._all,
    },
  });
}

/** Primary vendor for an order (first line item). */
export function primaryVendorProfileIdFromOrderItems(items: { listing: { vendorId: string } }[]) {
  return items[0]?.listing.vendorId ?? null;
}
