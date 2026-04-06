import { verifyOTP } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { email?: string; otp?: string };
  const email = body.email?.trim().toLowerCase();
  const otp = body.otp?.trim();
  if (!email || !otp) {
    return NextResponse.json({ error: "Email and OTP required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ok = await verifyOTP(email, otp);
  if (!ok) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
  return NextResponse.json({ ok: true });
}
