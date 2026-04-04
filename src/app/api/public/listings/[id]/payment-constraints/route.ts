import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const listing = await prisma.productListing.findFirst({
    where: { id, isActive: true },
    include: {
      vendor: {
        select: {
          acceptedPaymentMethods: true,
          requiresFullAdvance: true,
          minOrderForRTGS: true,
          minTokenPercentage: true,
          acceptsTokenPayment: true,
        },
      },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const v = listing.vendor;
  return NextResponse.json({
    requiresFullAdvance: v.requiresFullAdvance,
    acceptsTokenPayment: v.acceptsTokenPayment,
    minTokenPercentage: v.minTokenPercentage,
    minOrderForRTGS: v.minOrderForRTGS,
    acceptedPaymentMethods: v.acceptedPaymentMethods,
  });
}
