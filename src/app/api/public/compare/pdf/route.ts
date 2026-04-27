import { ComparePdfDocument } from "@/lib/compare-pdf";
import { prisma } from "@/lib/prisma";
import { STOREFRONT_LISTING_WHERE } from "@/lib/public-api";
import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { productIds?: string[] };
  const ids = Array.isArray(body.productIds) ? body.productIds.filter(Boolean).slice(0, 5) : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "productIds required" }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    include: {
      listings: {
        where: STOREFRONT_LISTING_WHERE,
        orderBy: { unitPrice: "asc" },
        take: 1,
      },
    },
  });

  const rows = products.map((p) => ({
    name: p.name,
    brand: p.brand,
    minPrice: p.listings[0]?.unitPrice ?? 0,
    specs: p.specs as Record<string, unknown>,
  }));

  const { renderToBuffer } = await import("@react-pdf/renderer");
  const buf = await renderToBuffer(
    createElement(ComparePdfDocument, { rows }) as Parameters<typeof renderToBuffer>[0],
  );

  return new NextResponse(Buffer.from(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="rentfoxxy-compare.pdf"',
    },
  });
}
