import { getVendorContext } from "@/lib/vendor-auth";
import { prisma } from "@/lib/prisma";
import type { BidStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await getVendorContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tab = (req.nextUrl.searchParams.get("tab") ?? "PENDING").toUpperCase();
  const allowed = new Set([
    "PENDING",
    "APPROVED",
    "REJECTED",
    "COUNTER_OFFERED",
    "EXPIRED",
    "PAID",
    "CANCELLED",
    "ALL",
  ]);
  const statusFilter: BidStatus | undefined =
    tab === "ALL" || !allowed.has(tab) ? undefined : (tab as BidStatus);

  const bids = await prisma.bid.findMany({
    where: {
      listing: { vendorId: ctx.vendorId },
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      listing: {
        include: { product: { select: { name: true, slug: true, brand: true } } },
      },
      customer: {
        select: {
          companyName: true,
          gstin: true,
        },
      },
    },
  });

  return NextResponse.json({
    bids: bids.map((b) => ({
      id: b.id,
      status: b.status,
      paymentOption: b.paymentOption,
      quantity: b.quantity,
      bidPricePerUnit: b.bidPricePerUnit,
      totalBidAmount: b.totalBidAmount,
      counterPrice: b.counterPrice,
      expiresAt: b.expiresAt?.toISOString() ?? null,
      vendorNote: b.vendorNote,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      listing: {
        id: b.listing.id,
        sku: b.listing.sku,
        unitPrice: b.listing.unitPrice,
        minBidPrice: b.listing.minBidPrice,
        product: b.listing.product,
      },
      customer: {
        companyName: b.customer.companyName,
        gstin: b.customer.gstin,
      },
      marginImpactPct:
        b.listing.unitPrice > 0
          ? Math.round(((b.bidPricePerUnit - b.listing.unitPrice) / b.listing.unitPrice) * 1000) / 10
          : 0,
    })),
  });
}
