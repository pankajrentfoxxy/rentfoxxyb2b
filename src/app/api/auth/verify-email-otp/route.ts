import { verifyOTP } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const body = (await req.json()) as { email?: string; otp?: string };
  const email = body.email?.trim().toLowerCase();
  const otp = body.otp?.trim();
  if (!email || !otp) {
    return NextResponse.json({ error: "Email and OTP required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      customerProfile: { select: { id: true } },
      vendorProfile: { select: { id: true } },
    },
  });
  if (!user) {
    return NextResponse.json({ error: "No registration found for this email" }, { status: 404 });
  }
  if (user.customerProfile || user.vendorProfile) {
    return NextResponse.json({ error: "Account already completed" }, { status: 400 });
  }

  const valid = await verifyOTP(email, otp);
  if (!valid) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  return NextResponse.json({ success: true });
}
