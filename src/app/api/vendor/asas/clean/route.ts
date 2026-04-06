import { cleanAsAsInventory, generateAsAsName } from "@/lib/lot-ai-cleaner";
import { getVendorContext } from "@/lib/vendor-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ctx = await getVendorContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { rawCSV?: string };
  const raw = body.rawCSV?.trim();
  if (!raw) return NextResponse.json({ error: "rawCSV required" }, { status: 400 });

  let cleaned;
  let issues: string[];
  try {
    const result = await cleanAsAsInventory(raw);
    cleaned = result.cleaned;
    issues = result.issues;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Clean failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (cleaned.length === 0) {
    return NextResponse.json({ error: "No valid rows", issues }, { status: 400 });
  }

  const meta = await generateAsAsName(
    cleaned.map((r) => ({
      brand: r.brand,
      model: r.model,
      condition: r.condition,
      count: r.count,
      estimatedValue: r.estimatedValue,
    })),
  );

  return NextResponse.json({ rows: cleaned, issues, meta });
}
