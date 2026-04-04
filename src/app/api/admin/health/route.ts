import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ scope: "admin-api", ok: true });
}
