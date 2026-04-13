import { mapListing, mapProductPublic, STOREFRONT_LISTING_WHERE } from "@/lib/public-api";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const listingSelect = {
  id: true,
  unitPrice: true,
  bulkPricing: true,
  stockQty: true,
  minOrderQty: true,
  isActive: true,
  requiresAdminApproval: true,
  condition: true,
} satisfies Prisma.ProductListingSelect;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: true,
      listings: {
        where: STOREFRONT_LISTING_WHERE,
        select: listingSelect,
      },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const sorted = [...product.listings].sort((a, b) => {
    const rank = (x: (typeof product.listings)[0]) => {
      const o: Record<string, number> = {
        BRAND_NEW: 0,
        REFURB_A_PLUS: 1,
        REFURB_A: 2,
        REFURB_B: 3,
        REFURB_C: 4,
      };
      return o[x.condition] ?? 99;
    };
    const rc = rank(a) - rank(b);
    if (rc !== 0) return rc;
    return a.unitPrice - b.unitPrice;
  });
  const lowestId = sorted[0]?.id;
  const listings = sorted.map((l, i) => mapListing(l, i)).map((l) => ({
    ...l,
    bestValue: l.id === lowestId,
  }));

  const base = mapProductPublic({ ...product, listings: product.listings });

  return NextResponse.json({
    product: {
      ...base,
      listings,
    },
  });
}
