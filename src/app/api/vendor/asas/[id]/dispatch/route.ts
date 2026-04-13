import { getVendorContext } from "@/lib/vendor-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const vctx = await getVendorContext();
  if (!vctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    dispatchCarrier?: string;
    dispatchAwb?: string;
  };
  const dispatchCarrier = body.dispatchCarrier?.trim();
  const dispatchAwb = body.dispatchAwb?.trim();
  if (!dispatchCarrier || !dispatchAwb) {
    return NextResponse.json({ error: "dispatchCarrier and dispatchAwb required" }, { status: 400 });
  }

  const { id } = await ctx.params;
  const listing = await prisma.asAsListing.findFirst({
    where: { id, vendorId: vctx.vendorId },
    include: { purchases: true },
  });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (listing.status !== "SOLD_OUT") {
    return NextResponse.json(
      { error: "Dispatch is available once the As-Is listing is fully sold" },
      { status: 400 },
    );
  }

  const dispatchedAt = new Date();
  await prisma.$transaction(
    listing.purchases.map((p) =>
      prisma.asAsPurchase.update({
        where: { id: p.id },
        data: { dispatchCarrier, dispatchAwb, dispatchedAt },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
