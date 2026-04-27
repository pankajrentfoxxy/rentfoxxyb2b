import { verifySmsOTP } from "@/lib/phone-otp";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function norm10(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return d.slice(2);
  return d.slice(-10);
}

export async function PUT(req: NextRequest) {
  const body = (await req.json()) as { email?: string; phone?: string; otp?: string };
  const email = body.email?.trim().toLowerCase();
  const phone10 = body.phone ? norm10(body.phone) : "";
  const otp = body.otp?.trim();
  if (!email || !phone10 || !otp) {
    return NextResponse.json({ error: "Email, phone, and OTP required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      customerProfile: { select: { id: true } },
      vendorProfile: { select: { id: true } },
    },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.customerProfile || user.vendorProfile) {
    return NextResponse.json({ error: "Account already completed" }, { status: 400 });
  }

  const ok = await verifySmsOTP(email, phone10, otp);
  if (!ok) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  const clash = await prisma.user.findFirst({
    where: {
      phone: phone10,
      NOT: { id: user.id },
    },
    select: { id: true },
  });
  if (clash) {
    return NextResponse.json({ error: "This number is already linked to another account" }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      phone: phone10,
      phoneVerified: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
