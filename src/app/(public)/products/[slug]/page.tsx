import { ProductDetailView } from "@/components/storefront/ProductDetailView";
import { mapListing, mapProductPublic, STOREFRONT_LISTING_WHERE } from "@/lib/public-api";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    select: { name: true },
  });
  if (!product) return { title: "Product" };
  return { title: product.name };
}

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

export default async function ProductDetailPage({ params }: PageProps) {
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

  if (!product) notFound();

  const sorted = [...product.listings].sort((a, b) => {
    const rank = (c: string) =>
      ({ BRAND_NEW: 0, REFURB_A_PLUS: 1, REFURB_A: 2, REFURB_B: 3, REFURB_C: 4 } as Record<string, number>)[c] ??
      99;
    const rc = rank(a.condition) - rank(b.condition);
    if (rc !== 0) return rc;
    return a.unitPrice - b.unitPrice;
  });
  const lowestId = sorted[0]?.id;
  const listings = sorted.map((l, i) => ({
    ...mapListing(l, i),
    bestValue: l.id === lowestId,
  }));

  const base = mapProductPublic({ ...product, listings: product.listings });

  return <ProductDetailView initial={{ ...base, listings }} />;
}
