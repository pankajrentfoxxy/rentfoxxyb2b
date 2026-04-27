import { prisma } from "@/lib/prisma";

/** True if any active listing is &gt;15% above market average for that product (P8 sidebar dot). */
export async function vendorHasReducePriceAlert(vendorId: string): Promise<boolean> {
  const rows = await prisma.productListing.findMany({
    where: { vendorId, isActive: true },
    select: { productId: true, unitPrice: true },
  });
  for (const l of rows) {
    const agg = await prisma.productListing.aggregate({
      where: { productId: l.productId, isActive: true },
      _avg: { unitPrice: true },
    });
    const avg = agg._avg.unitPrice;
    if (avg != null && avg > 0) {
      const pct = Math.round(((l.unitPrice - avg) / avg) * 100);
      if (pct > 15) return true;
    }
  }
  return false;
}
