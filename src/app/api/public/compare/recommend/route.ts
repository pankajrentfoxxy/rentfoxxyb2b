import { geminiGenerateJson } from "@/lib/gemini-json";
import { prisma } from "@/lib/prisma";
import { STOREFRONT_LISTING_WHERE } from "@/lib/public-api";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { productIds?: string[] };
    const ids = Array.isArray(body.productIds) ? body.productIds.filter(Boolean).slice(0, 5) : [];
    if (ids.length < 2) {
      return NextResponse.json({ error: "At least two productIds required" }, { status: 400 });
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

    const payload = products.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      specs: p.specs,
      minPrice: p.listings[0]?.unitPrice ?? 0,
    }));

    const prompt = `You are a B2B laptop procurement advisor.
Compare these ${payload.length} laptop models and recommend the best for each category.
Products: ${JSON.stringify(payload)}
Return ONLY valid JSON (no markdown):
{
  "bestForPerformance": "exact product name from list",
  "bestForBudget": "exact product name from list",
  "bestValueOverall": "exact product name from list",
  "summary": "2-3 sentence explanation",
  "recommendations": [
    { "useCase": "string", "product": "exact product name", "reason": "string" }
  ]
}`;

    const parsed = (await geminiGenerateJson(prompt)) as Record<string, unknown>;
    return NextResponse.json(parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
