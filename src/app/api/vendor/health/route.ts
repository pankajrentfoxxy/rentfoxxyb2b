import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ scope: "vendor-api", ok: true });
}
