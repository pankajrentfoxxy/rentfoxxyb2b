import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { email?: string; otp?: string };
  const email = body.email?.trim().toLowerCase();
  const otp = body.otp?.trim();
  if (!email || !otp) {
    return NextResponse.json({ error: "Email and OTP required" }, { status: 400 });
  }

  const pending = await prisma.pendingRegistration.findUnique({ where: { email } });
  if (!pending || pending.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  const valid = await bcrypt.compare(otp, pending.otpHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  if (pending.role === "ADMIN") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.pendingRegistration.delete({ where: { email } });

    const user = await tx.user.create({
      data: {
        email: pending.email,
        name: pending.name,
        phone: pending.phone,
        passwordHash: pending.passwordHash,
        role: pending.role,
        isVerified: true,
      },
    });

    if (pending.role === "CUSTOMER") {
      await tx.customerProfile.create({
        data: {
          userId: user.id,
          companyName: pending.companyName,
          gstin: pending.gstin,
        },
      });
    } else if (pending.role === "VENDOR") {
      await tx.vendorProfile.create({
        data: {
          userId: user.id,
          companyName: pending.companyName ?? "Vendor",
          gstin: pending.gstin ?? "",
          pan: pending.pan ?? "",
          bankAccount: pending.bankAccount ?? "",
          ifscCode: pending.ifscCode ?? "",
          accountName: pending.accountName ?? pending.companyName ?? "Vendor",
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
