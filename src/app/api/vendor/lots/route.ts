import { toLotItemCondition, type LotCSVRow } from "@/lib/lot-ai-cleaner";
import { createVerificationTask } from "@/lib/verification";
import { getVendorContext } from "@/lib/vendor-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getVendorContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lots = await prisma.lotListing.findMany({
    where: { vendorId: ctx.vendorId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { purchases: true } } },
  });
  return NextResponse.json({ lots });
}

export async function POST(req: NextRequest) {
  const ctx = await getVendorContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    title?: string;
    description?: string | null;
    highlights?: string[];
    lotSize?: number;
    coverImage?: string | null;
    items?: LotCSVRow[];
  };

  const title = body.title?.trim();
  const lotSize = Math.max(1, Math.floor(Number(body.lotSize ?? 0)));
  const items = Array.isArray(body.items) ? body.items : [];

  if (!title || items.length === 0) {
    return NextResponse.json({ error: "title and items required" }, { status: 400 });
  }

  const totalQuantity = items.reduce((s, r) => s + Math.max(0, Math.floor(Number(r.count) || 0)), 0);
  if (totalQuantity < lotSize || totalQuantity % lotSize !== 0) {
    return NextResponse.json(
      { error: "Total units must be a positive multiple of lot size" },
      { status: 400 },
    );
  }

  const totalLots = totalQuantity / lotSize;
  const valueSum = items.reduce((s, r) => s + Number(r.unitPrice) * Math.max(0, Math.floor(r.count)), 0);
  const pricePerLot = (valueSum / totalQuantity) * lotSize;

  const highlights = Array.isArray(body.highlights)
    ? body.highlights.map((h) => String(h).trim()).filter(Boolean).slice(0, 10)
    : [];

  const lot = await prisma.lotListing.create({
    data: {
      vendorId: ctx.vendorId,
      title,
      description: body.description ?? null,
      highlights,
      coverImage: body.coverImage ?? null,
      totalQuantity,
      lotSize,
      totalLots,
      lotsSold: 0,
      pricePerLot,
      status: "PENDING_VERIFICATION",
      items: {
        create: items.map((r) => ({
          brand: String(r.brand).slice(0, 120),
          model: String(r.model).slice(0, 120),
          generation: r.generation ? String(r.generation).slice(0, 120) : null,
          processor: String(r.processor).slice(0, 200),
          ramGb: Math.max(0, Math.floor(Number(r.ramGb))),
          storageGb: Math.max(0, Math.floor(Number(r.storageGb))),
          storageType: String(r.storageType).slice(0, 32),
          displayInch: Number(r.displayInch) || 14,
          os: String(r.os).slice(0, 120),
          condition: toLotItemCondition(r.condition),
          count: Math.max(0, Math.floor(Number(r.count))),
          unitPrice: Math.max(0, Number(r.unitPrice)),
          notes: r.notes ? String(r.notes).slice(0, 500) : null,
        })),
      },
    },
  });

  await createVerificationTask({
    listingType: "LOT",
    listingId: lot.id,
    vendorId: ctx.vendorId,
  });

  return NextResponse.json({ lot: { id: lot.id, status: lot.status } });
}
