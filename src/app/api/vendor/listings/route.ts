import { createVerificationTask, productListingNeedsVerification } from "@/lib/verification";
import { getVendorContext } from "@/lib/vendor-auth";
import {
  defaultRefurbFieldsForBrandNew,
  parseProductCondition,
  validateListingConditionFields,
} from "@/lib/listing-condition";
import { prisma } from "@/lib/prisma";
import { Prisma, type ProductCondition } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function slugSkuPart(slug: string) {
  const s = slug.replace(/[^a-z0-9]+/gi, "-").slice(0, 12).toUpperCase();
  return s || "SKU";
}

export async function POST(req: NextRequest) {
  const ctx = await getVendorContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    productId?: string;
    sku?: string;
    unitPrice?: number;
    minBidPrice?: number;
    stockQty?: number;
    minOrderQty?: number;
    bulkPricing?: unknown;
    isActive?: boolean;
    condition?: string;
    batteryHealth?: number | null;
    conditionNotes?: string | null;
    warrantyMonths?: number;
    warrantyType?: string | null;
    refurbImages?: string[];
  };

  if (!body.productId?.trim()) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: { id: body.productId, isActive: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found or inactive" }, { status: 400 });
  }

  const unitPrice = Number(body.unitPrice);
  const minBidPrice = Number(body.minBidPrice);
  const stockQty = Math.max(0, Math.floor(Number(body.stockQty ?? 0)));
  const minOrderQty = Math.max(1, Math.floor(Number(body.minOrderQty ?? 1)));

  const condition: ProductCondition = parseProductCondition(body.condition) ?? "BRAND_NEW";

  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    return NextResponse.json({ error: "unitPrice invalid" }, { status: 400 });
  }
  if (!Number.isFinite(minBidPrice) || minBidPrice <= 0) {
    return NextResponse.json({ error: "minBidPrice invalid" }, { status: 400 });
  }
  if (minBidPrice > unitPrice) {
    return NextResponse.json({ error: "minBidPrice cannot exceed unitPrice" }, { status: 400 });
  }

  const refurbImages = Array.isArray(body.refurbImages)
    ? body.refurbImages.filter((u) => typeof u === "string" && u.trim()).slice(0, 3)
    : [];

  const fieldErr = validateListingConditionFields({
    condition,
    batteryHealth: body.batteryHealth,
    warrantyMonths: body.warrantyMonths,
    warrantyType: body.warrantyType,
    conditionNotes: body.conditionNotes,
    refurbImages,
    unitPrice,
    minBidPrice,
  });
  if (fieldErr) {
    return NextResponse.json({ error: fieldErr }, { status: 400 });
  }

  const brandNewDefaults = defaultRefurbFieldsForBrandNew();
  const isGradeC = condition === "REFURB_C";
  const requiresAdminApproval = isGradeC;
  const isActive = isGradeC ? false : body.isActive !== false;

  let bulkPricingPayload: Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined;
  if (body.bulkPricing !== undefined) {
    if (body.bulkPricing === null) {
      bulkPricingPayload = Prisma.JsonNull;
    } else {
      try {
        bulkPricingPayload = body.bulkPricing as Prisma.InputJsonValue;
        JSON.stringify(bulkPricingPayload);
      } catch {
        return NextResponse.json({ error: "bulkPricing must be JSON-serializable" }, { status: 400 });
      }
    }
  }

  const baseSku =
    body.sku?.trim() ||
    `${slugSkuPart(product.slug)}-${ctx.vendorId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  let sku = baseSku;
  let attempt = 0;
  while (attempt < 5) {
    const clash = await prisma.productListing.findUnique({ where: { sku } });
    if (!clash) break;
    sku = `${baseSku}-${attempt + 1}`;
    attempt++;
  }
  if (attempt >= 5) {
    return NextResponse.json({ error: "Could not allocate SKU" }, { status: 500 });
  }

  const listing = await prisma.productListing.create({
    data: {
      productId: product.id,
      vendorId: ctx.vendorId,
      sku,
      unitPrice,
      minBidPrice,
      stockQty,
      minOrderQty,
      ...(bulkPricingPayload !== undefined ? { bulkPricing: bulkPricingPayload } : {}),
      isActive,
      condition,
      ...(condition === "BRAND_NEW"
        ? {
            batteryHealth: brandNewDefaults.batteryHealth,
            conditionNotes: brandNewDefaults.conditionNotes,
            warrantyMonths: brandNewDefaults.warrantyMonths,
            warrantyType: brandNewDefaults.warrantyType,
            refurbImages: brandNewDefaults.refurbImages,
            requiresAdminApproval: brandNewDefaults.requiresAdminApproval,
          }
        : {
            batteryHealth: body.batteryHealth ?? null,
            conditionNotes: body.conditionNotes?.trim() || null,
            warrantyMonths: Math.min(24, Math.max(0, Math.floor(Number(body.warrantyMonths ?? 0)))),
            warrantyType: body.warrantyType?.trim() ?? null,
            refurbImages,
            requiresAdminApproval,
          }),
    },
    include: { product: { select: { name: true, slug: true } } },
  });

  if (productListingNeedsVerification(condition)) {
    await createVerificationTask({
      listingType: "PRODUCT_LISTING",
      listingId: listing.id,
      vendorId: ctx.vendorId,
    });
  }

  return NextResponse.json({
    listing: {
      id: listing.id,
      sku: listing.sku,
      product: listing.product,
      requiresAdminApproval: listing.requiresAdminApproval,
      isActive: listing.isActive,
    },
  });
}
