import { geminiGenerateJson } from "@/lib/gemini-json";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STOREFRONT_LISTING_WHERE } from "@/lib/public-api";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

async function fileToText(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || file.type === "text/plain") {
    return buf.toString("utf8");
  }
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const mod = await import("pdf-parse");
    const pdfParse = (mod as unknown as { default?: (b: Buffer) => Promise<{ text?: string }> }).default ?? (mod as unknown as (b: Buffer) => Promise<{ text?: string }>);
    const data = await pdfParse(buf);
    return data.text ?? "";
  }
  throw new Error("Upload a .pdf or .txt PO");
}

async function matchProduct(description: string): Promise<{
  id: string;
  name: string;
  slug: string;
  priceMin: number;
  listingId: string;
  unitPrice: number;
  minOrderQty: number;
  stockQty: number;
} | null> {
  const q = description.trim().slice(0, 80);
  if (q.length < 3) return null;
  const words = q.split(/\s+/).filter((w) => w.length > 2).slice(0, 4);
  if (!words.length) return null;
  const product = await prisma.product.findFirst({
    where: {
      isActive: true,
      OR: words.map((w) => ({ name: { contains: w, mode: "insensitive" as const } })),
    },
    include: {
      listings: {
        where: STOREFRONT_LISTING_WHERE,
        orderBy: { unitPrice: "asc" },
        take: 1,
        select: { id: true, unitPrice: true, minOrderQty: true, stockQty: true },
      },
    },
  });
  if (!product) return null;
  const L = product.listings[0];
  if (!L) return null;
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    priceMin: L.unitPrice,
    listingId: L.id,
    unitPrice: L.unitPrice,
    minOrderQty: L.minOrderQty,
    stockQty: L.stockQty,
  };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  let poText: string;
  try {
    poText = await fileToText(file);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not read file";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (poText.trim().length < 20) {
    return NextResponse.json({ error: "Could not extract enough text from PO" }, { status: 400 });
  }

  try {
    const prompt = `Extract all line items from this purchase order and return structured JSON only (no markdown).
PO content:
"""
${poText.slice(0, 12000)}
"""
Schema:
{
  "poNumber": "string or null",
  "companyName": "string or null",
  "lines": [
    { "description": "original line text", "quantity": number, "sku": "string or null" }
  ]
}`;

    const raw = (await geminiGenerateJson(prompt)) as {
      poNumber?: string | null;
      companyName?: string | null;
      lines?: { description?: string; quantity?: number; sku?: string | null }[];
    };

    const lines = Array.isArray(raw.lines) ? raw.lines : [];
    const enriched = await Promise.all(
      lines.map(async (line) => {
        const description = String(line.description ?? "").trim();
        const quantity = Math.max(1, Math.floor(Number(line.quantity) || 1));
        const matched = description ? await matchProduct(description) : null;
        return {
          description,
          quantity,
          sku: line.sku ?? null,
          matchedProduct: matched,
        };
      }),
    );

    return NextResponse.json({
      poNumber: raw.poNumber ?? null,
      companyName: raw.companyName ?? null,
      lines: enriched,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Parse failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
