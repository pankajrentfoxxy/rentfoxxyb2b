import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ scope: "customer-api", ok: true });
}
