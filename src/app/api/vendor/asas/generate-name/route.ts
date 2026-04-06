import { generateAsAsName, type AsAsInventoryInput } from "@/lib/lot-ai-cleaner";
import { getVendorContext } from "@/lib/vendor-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ctx = await getVendorContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { items?: AsAsInventoryInput[] };
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "items required" }, { status: 400 });
  }

  try {
    const result = await generateAsAsName(items);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Name generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
