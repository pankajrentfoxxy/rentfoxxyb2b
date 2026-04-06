import { getVendorContext } from "@/lib/vendor-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Proportional manifest stub — extend with Gemini when GEMINI_API_KEY is set. */
function simpleManifest(
  purchases: { id: string; customerId: string; lotsCount: number; totalUnits: number }[],
  totalUnits: number,
) {
  const out: Record<string, { lots: number; share: string }> = {};
  for (const p of purchases) {
    out[p.id] = {
      lots: p.lotsCount,
      share: `${((p.totalUnits / totalUnits) * 100).toFixed(1)}% of inventory (provisional mix)`,
    };
  }
  return out;
}

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const vctx = await getVendorContext();
  if (!vctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const lot = await prisma.lotListing.findFirst({
    where: { id, vendorId: vctx.vendorId },
    include: { purchases: true },
  });
  if (!lot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (lot.status !== "SOLD_OUT" && lot.lotsSold < lot.totalLots) {
    return NextResponse.json(
      { error: "Dispatch is for fully sold lots or after early-dispatch override (not implemented)" },
      { status: 400 },
    );
  }

  const manifest = simpleManifest(
    lot.purchases.map((p) => ({
      id: p.id,
      customerId: p.customerId,
      lotsCount: p.lotsCount,
      totalUnits: p.totalUnits,
    })),
    lot.totalQuantity,
  );

  await prisma.$transaction(async (tx) => {
    for (const p of lot.purchases) {
      await tx.lotPurchase.update({
        where: { id: p.id },
        data: { manifest: manifest[p.id] ?? {} },
      });
    }
    await tx.lotListing.update({
      where: { id: lot.id },
      data: { status: "DISPATCHED", dispatchedAt: new Date() },
    });
  });

  return NextResponse.json({ ok: true });
}
