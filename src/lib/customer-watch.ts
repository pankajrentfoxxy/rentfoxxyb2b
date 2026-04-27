import { prisma } from "@/lib/prisma";
import { STOREFRONT_LISTING_WHERE } from "@/lib/public-api";

/** Watches where storefront min price is already at or below the customer target (sidebar badge). */
export async function customerWatchReachedCount(userId: string): Promise<number> {
  const profile = await prisma.customerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return 0;

  const watches = await prisma.priceWatch.findMany({
    where: { customerId: profile.id, isActive: true },
    include: {
      product: {
        select: {
          listings: {
            where: STOREFRONT_LISTING_WHERE,
            orderBy: { unitPrice: "asc" },
            take: 1,
            select: { unitPrice: true },
          },
        },
      },
    },
  });

  return watches.filter((w) => {
    const minP = w.product.listings[0]?.unitPrice;
    return minP != null && minP <= w.targetPrice;
  }).length;
}
