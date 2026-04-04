import {
  defaultRefurbFieldsForBrandNew,
  parseProductCondition,
  validateListingConditionFields,
} from "@/lib/listing-condition";
import { getVendorContext } from "@/lib/vendor-auth";
import { prisma } from "@/lib/prisma";
import { Prisma, type ProductCondition } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, route: { params: Promise<{ id: string }> }) {
  const ctx = await getVendorContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await route.params;
  const existing = await prisma.productListing.findFirst({
    where: { id, vendorId: ctx.vendorId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as {
    unitPrice?: number;
    minBidPrice?: number;
    stockQty?: number;
    minOrderQty?: number;
    bulkPricing?: unknown;
    isActive?: boolean;
    sku?: string;
    condition?: string;
    batteryHealth?: number | null;
    conditionNotes?: string | null;
    warrantyMonths?: number;
    warrantyType?: string | null;
    refurbImages?: string[];
  };

  const data: Prisma.ProductListingUpdateInput = {};

  if (body.unitPrice !== undefined) {
    const v = Number(body.unitPrice);
    if (!Number.isFinite(v) || v <= 0) {
      return NextResponse.json({ error: "unitPrice invalid" }, { status: 400 });
    }
    data.unitPrice = v;
  }
  if (body.minBidPrice !== undefined) {
    const v = Number(body.minBidPrice);
    if (!Number.isFinite(v) || v <= 0) {
      return NextResponse.json({ error: "minBidPrice invalid" }, { status: 400 });
    }
    data.minBidPrice = v;
  }
  if (body.stockQty !== undefined) {
    data.stockQty = Math.max(0, Math.floor(Number(body.stockQty)));
  }
  if (body.minOrderQty !== undefined) {
    data.minOrderQty = Math.max(1, Math.floor(Number(body.minOrderQty)));
  }
  if (body.isActive !== undefined) {
    data.isActive = Boolean(body.isActive);
  }
  if (body.sku !== undefined) {
    const sku = body.sku.trim();
    if (!sku) {
      return NextResponse.json({ error: "sku empty" }, { status: 400 });
    }
    const clash = await prisma.productListing.findFirst({
      where: { sku, NOT: { id } },
    });
    if (clash) {
      return NextResponse.json({ error: "SKU already in use" }, { status: 400 });
    }
    data.sku = sku;
  }
  if (body.bulkPricing !== undefined) {
    if (body.bulkPricing === null) {
      data.bulkPricing = Prisma.JsonNull;
    } else {
      try {
        JSON.stringify(body.bulkPricing);
        data.bulkPricing = body.bulkPricing as Prisma.InputJsonValue;
      } catch {
        return NextResponse.json({ error: "bulkPricing invalid" }, { status: 400 });
      }
    }
  }

  const nextCondition: ProductCondition =
    body.condition !== undefined
      ? parseProductCondition(body.condition) ?? existing.condition
      : existing.condition;

  if (body.condition !== undefined) {
    data.condition = nextCondition;
  }

  const refurbImages =
    body.refurbImages !== undefined
      ? body.refurbImages.filter((u) => typeof u === "string" && u.trim()).slice(0, 3)
      : undefined;

  if (body.batteryHealth !== undefined) {
    data.batteryHealth = body.batteryHealth;
  }
  if (body.conditionNotes !== undefined) {
    data.conditionNotes = body.conditionNotes?.trim() || null;
  }
  if (body.warrantyMonths !== undefined) {
    data.warrantyMonths = Math.min(24, Math.max(0, Math.floor(Number(body.warrantyMonths))));
  }
  if (body.warrantyType !== undefined) {
    data.warrantyType = body.warrantyType?.trim() || null;
  }
  if (refurbImages !== undefined) {
    data.refurbImages = refurbImages;
  }

  if (nextCondition === "BRAND_NEW") {
    const d = defaultRefurbFieldsForBrandNew();
    data.batteryHealth = null;
    data.conditionNotes = null;
    data.warrantyMonths = d.warrantyMonths;
    data.warrantyType = null;
    data.refurbImages = [];
    data.requiresAdminApproval = false;
  }

  const changedToGradeC =
    body.condition !== undefined &&
    parseProductCondition(body.condition) === "REFURB_C" &&
    existing.condition !== "REFURB_C";

  if (nextCondition === "REFURB_C") {
    if (changedToGradeC) {
      data.requiresAdminApproval = true;
      data.isActive = false;
    } else if (existing.requiresAdminApproval) {
      data.isActive = false;
    }
  } else if (body.condition !== undefined && nextCondition !== "BRAND_NEW") {
    data.requiresAdminApproval = false;
  }

  const nextUnit =
    typeof data.unitPrice === "number" ? data.unitPrice : existing.unitPrice;
  const nextMinBid =
    typeof data.minBidPrice === "number" ? data.minBidPrice : existing.minBidPrice;
  const nextBat =
    body.batteryHealth !== undefined ? body.batteryHealth : existing.batteryHealth;
  const nextWm =
    body.warrantyMonths !== undefined ? Number(body.warrantyMonths) : existing.warrantyMonths;
  const nextWt =
    body.warrantyType !== undefined ? body.warrantyType : existing.warrantyType;
  const nextNotes =
    body.conditionNotes !== undefined ? body.conditionNotes : existing.conditionNotes;
  const nextRefurb = refurbImages ?? existing.refurbImages;

  const fieldErr = validateListingConditionFields({
    condition: nextCondition,
    batteryHealth: nextBat,
    warrantyMonths: nextWm,
    warrantyType: nextWt,
    conditionNotes: nextNotes,
    refurbImages: [...nextRefurb],
    unitPrice: nextUnit,
    minBidPrice: nextMinBid,
  });
  if (fieldErr) {
    return NextResponse.json({ error: fieldErr }, { status: 400 });
  }

  if (nextMinBid > nextUnit) {
    return NextResponse.json({ error: "minBidPrice cannot exceed unitPrice" }, { status: 400 });
  }

  const listing = await prisma.productListing.update({
    where: { id },
    data,
    include: { product: { select: { name: true, slug: true } } },
  });

  return NextResponse.json({
    listing: {
      id: listing.id,
      sku: listing.sku,
      unitPrice: listing.unitPrice,
      minBidPrice: listing.minBidPrice,
      stockQty: listing.stockQty,
      minOrderQty: listing.minOrderQty,
      isActive: listing.isActive,
      condition: listing.condition,
      requiresAdminApproval: listing.requiresAdminApproval,
      product: listing.product,
    },
  });
}
