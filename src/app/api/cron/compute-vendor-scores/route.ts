import { computeAllVendorScores } from "@/lib/vendor-score";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function authCron(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { recomputed } = await computeAllVendorScores();
  return NextResponse.json({ ok: true, recomputed });
}
