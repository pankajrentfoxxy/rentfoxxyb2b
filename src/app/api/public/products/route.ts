import {
  CPU_OPTS,
  mapProductPublic,
  productMatchesCpuFilter,
  productMatchesRamFilter,
  STOREFRONT_LISTING_WHERE,
} from "@/lib/public-api";
import { parseConditionFilters } from "@/constants/grading";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") ?? undefined;
  const brandParam = searchParams.get("brand");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const search = searchParams.get("search") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const ramFilters = searchParams.get("ram")?.split(",").filter(Boolean) ?? [];
  const cpuFilters = searchParams.get("cpu")?.split(",").filter(Boolean) ?? [];
  const conditionFilters = parseConditionFilters(searchParams.get("condition"));

  const listingFilter: Prisma.ProductListingWhereInput = {
    ...STOREFRONT_LISTING_WHERE,
    ...(conditionFilters.length ? { condition: { in: conditionFilters } } : {}),
  };

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    listings: { some: listingFilter },
  };

  if (category) {
    where.category = { slug: category };
  }

  if (brandParam) {
    const brands = brandParam.split(",").filter(Boolean);
    if (brands.length) where.brand = { in: brands };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
    ];
  }

  const distinctBrands = await prisma.product.findMany({
    where: { isActive: true },
    select: { brand: true },
    distinct: ["brand"],
    orderBy: { brand: "asc" },
  });

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      listings: { where: listingFilter, select: listingSelect },
    },
    orderBy: { createdAt: "desc" },
  });

  let mapped = products.map(mapProductPublic);

  const minP = minPrice ? Number(minPrice) : null;
  const maxP = maxPrice ? Number(maxPrice) : null;
  if (minP != null && !Number.isNaN(minP)) {
    mapped = mapped.filter((p) => p.priceMax >= minP);
  }
  if (maxP != null && !Number.isNaN(maxP)) {
    mapped = mapped.filter((p) => p.priceMin <= maxP);
  }

  if (ramFilters.length) {
    mapped = mapped.filter((p) => productMatchesRamFilter(p.specs, ramFilters));
  }
  if (cpuFilters.length) {
    mapped = mapped.filter((p) => productMatchesCpuFilter(p.specs, cpuFilters));
  }

  const sort = searchParams.get("sort") ?? "newest";
  if (sort === "price_asc") {
    mapped.sort((a, b) => a.priceMin - b.priceMin);
  } else if (sort === "price_desc") {
    mapped.sort((a, b) => b.priceMax - a.priceMax);
  } else if (sort === "popular") {
    mapped.sort((a, b) => b.optionCount - a.optionCount);
  }

  const total = mapped.length;
  const start = (page - 1) * limit;
  const slice = mapped.slice(start, start + limit);

  return NextResponse.json({
    products: slice,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    filterMeta: {
      ramOptions: ["4GB", "8GB", "16GB", "32GB"],
      cpuOptions: CPU_OPTS,
      brands: distinctBrands.map((b) => b.brand),
    },
  });
}
