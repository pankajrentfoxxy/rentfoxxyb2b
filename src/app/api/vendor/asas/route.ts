import { toLotItemCondition } from "@/lib/lot-ai-cleaner";
import { createVerificationTask } from "@/lib/verification";
import { getVendorContext } from "@/lib/vendor-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Row = {
  brand: string;
  model: string;
  generation?: string | null;
  processor: string;
  ramGb: number;
  storageGb: number;
  storageType: string;
  condition: string;
  count: number;
  estimatedValue: number;
};

export async function GET() {
  const ctx = await getVendorContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const listings = await prisma.asAsListing.findMany({
    where: { vendorId: ctx.vendorId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ listings });
}

export async function POST(req: NextRequest) {
  const ctx = await getVendorContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    title?: string;
    description?: string | null;
    highlights?: string[];
    avgUnitPrice?: number;
    totalValue?: number;
    allowBidding?: boolean;
    allowMultiBuyer?: boolean;
    aiSuggestedLots?: number | null;
    items?: Row[];
  };

  const items = Array.isArray(body.items) ? body.items : [];
  if (!body.title?.trim() || items.length === 0) {
    return NextResponse.json({ error: "title and items required" }, { status: 400 });
  }

  const totalUnits = items.reduce((s, r) => s + Math.max(0, Math.floor(r.count)), 0);
  const totalValue =
    body.totalValue ??
    items.reduce((s, r) => s + Math.max(0, Math.floor(r.count)) * Math.max(0, Number(r.estimatedValue)), 0);
  const avgUnitPrice = body.avgUnitPrice ?? (totalUnits > 0 ? totalValue / totalUnits : 0);

  const listing = await prisma.asAsListing.create({
    data: {
      vendorId: ctx.vendorId,
      title: body.title.trim(),
      description: body.description ?? null,
      highlights: Array.isArray(body.highlights) ? body.highlights.slice(0, 8) : [],
      totalUnits,
      unitsSold: 0,
      avgUnitPrice,
      totalValue,
      allowBidding: body.allowBidding !== false,
      allowMultiBuyer: body.allowMultiBuyer === true,
      aiSuggestedLots: body.aiSuggestedLots ?? null,
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
          condition: toLotItemCondition(r.condition),
          count: Math.max(0, Math.floor(Number(r.count))),
          estimatedValue: Math.max(0, Number(r.estimatedValue)),
        })),
      },
    },
  });

  await createVerificationTask({
    listingType: "ASAS",
    listingId: listing.id,
    vendorId: ctx.vendorId,
  });

  return NextResponse.json({ listing: { id: listing.id, status: listing.status } });
}
