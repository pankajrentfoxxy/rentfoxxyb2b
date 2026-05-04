import { CONDITION_SORT_RANK, GRADE_CONFIG } from "@/constants/grading";
import { normalizePublicImagePath } from "@/lib/image-url";
import { prisma } from "@/lib/prisma";
import type { ProductCondition } from "@prisma/client";
import ProductListClient, { ProductData } from "./ProductListClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ pendingGradeC?: string }>;
}) {
  const sp = await searchParams;
  const pendingGradeCOnly = sp.pendingGradeC === "1";

  const products = await prisma.product.findMany({
    where: pendingGradeCOnly
      ? {
          listings: {
            some: { requiresAdminApproval: true, condition: "REFURB_C" },
          },
        }
      : undefined,
    orderBy: { name: "asc" },
    include: {
      category: { select: { name: true } },
      listings: {
        select: {
          unitPrice: true,
          isActive: true,
          vendorId: true,
          condition: true,
          requiresAdminApproval: true,
        },
      },
    },
  });

  const initialData: ProductData[] = products.map((p) => {
    const live = p.listings.filter((l) => l.isActive && !l.requiresAdminApproval);
    const prices = live.map((l) => l.unitPrice);
    const minP = prices.length ? Math.min(...prices) : 0;
    const maxP = prices.length ? Math.max(...prices) : 0;
    const vendorCount = new Set(p.listings.map((l) => l.vendorId)).size;
    const img = p.images[0] ? normalizePublicImagePath(p.images[0]) : null;
    const condLabels = Array.from(new Set(live.map((l) => l.condition as ProductCondition))).sort(
      (a, b) => CONDITION_SORT_RANK[a] - CONDITION_SORT_RANK[b],
    );
    const conditionLive = condLabels.map((c) => GRADE_CONFIG[c].label).join(", ") || "—";
    const pendingCCount = p.listings.filter(
      (l) => l.requiresAdminApproval && l.condition === "REFURB_C",
    ).length;
    const priceRangeDisplay =
      prices.length > 0 ? `${minP.toLocaleString("en-IN")} – ${maxP.toLocaleString("en-IN")}` : "—";

    return {
      id: p.id,
      imageUrl: img,
      name: p.name,
      categoryName: p.category.name,
      brand: p.brand,
      conditionLive,
      pendingCCount,
      vendorCount,
      priceRangeDisplay,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
    };
  });

  return (
    <div className="mx-auto max-w-7xl">
      <ProductListClient initialData={initialData} pendingGradeCOnly={pendingGradeCOnly} />
    </div>
  );
}
