import { readRawCSVFromRequest } from "@/lib/csv-upload-request";
import { cleanAsAsInventory } from "@/lib/lot-ai-cleaner";
import { getVendorContext } from "@/lib/vendor-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ctx = await getVendorContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const read = await readRawCSVFromRequest(req);
  if (!read.ok) {
    return NextResponse.json({ error: read.error }, { status: read.status });
  }

  try {
    const result = await cleanAsAsInventory(read.raw);
    if (result.cleaned.length === 0) {
      return NextResponse.json(
        { error: "No valid rows", issues: result.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Clean failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
