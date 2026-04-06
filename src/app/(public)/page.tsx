import { HomeAsAsDeals } from "@/components/storefront/HomeAsAsDeals";
import { HowItWorks } from "@/components/storefront/HowItWorks";
import { HomeCategories } from "@/components/storefront/HomeCategories";
import { HomeCTA } from "@/components/storefront/HomeCTA";
import { HomeFeatured } from "@/components/storefront/HomeFeatured";
import { HomeFeatures } from "@/components/storefront/HomeFeatures";
import { HomeHero } from "@/components/storefront/HomeHero";
import { HomeLotSales } from "@/components/storefront/HomeLotSales";
import { mapProductPublic, STOREFRONT_LISTING_WHERE } from "@/lib/public-api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function loadHomeCatalog() {
  return Promise.all([
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: 8,
      include: {
        category: true,
        listings: {
          where: STOREFRONT_LISTING_WHERE,
          select: {
            id: true,
            unitPrice: true,
            bulkPricing: true,
            stockQty: true,
            minOrderQty: true,
            isActive: true,
            requiresAdminApproval: true,
            condition: true,
            batteryHealth: true,
            warrantyMonths: true,
            warrantyType: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    }),
  ]);
}

export default async function HomePage() {
  type Pair = Awaited<ReturnType<typeof loadHomeCatalog>>;
  let rawFeatured: Pair[0] = [] as Pair[0];
  let rawCategories: Pair[1] = [] as Pair[1];
  let catalogDown = false;

  try {
    const pair = await loadHomeCatalog();
    rawFeatured = pair[0];
    rawCategories = pair[1];
  } catch (err) {
    catalogDown = true;
    console.error(
      "[home] Catalog query failed — ensure Postgres is running and DATABASE_URL is correct.",
      err,
    );
  }

  const featured = rawFeatured.map(mapProductPublic);
  const categories = rawCategories.map((c) => ({
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    productCount: c._count.products,
  }));

  return (
    <>
      {catalogDown ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950">
          {process.env.NODE_ENV === "development" ? (
            <>
              <strong>Catalog offline.</strong> Start Postgres (e.g.{" "}
              <code className="rounded bg-amber-100/80 px-1 font-mono text-xs">npm run db:local:up</code>) and
              set <code className="rounded bg-amber-100/80 px-1 font-mono text-xs">DATABASE_URL</code> in{" "}
              <code className="rounded bg-amber-100/80 px-1 font-mono text-xs">.env.local</code>.
            </>
          ) : (
            <>
              <strong>Catalog temporarily unavailable.</strong> Please try again in a few minutes.
            </>
          )}
        </div>
      ) : null}
      <HomeHero />
      <HomeCategories categories={categories} />
      <HomeLotSales />
      <HomeAsAsDeals />
      <HomeFeatured products={featured} />
      <HowItWorks />
      <HomeFeatures />
      <HomeCTA />
    </>
  );
}
