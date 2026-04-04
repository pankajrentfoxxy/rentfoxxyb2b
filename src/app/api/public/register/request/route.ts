import { fromEmail, getResend } from "@/lib/resend";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    email?: string;
    password?: string;
    role?: Role;
    name?: string;
    phone?: string;
    companyName?: string;
    gstin?: string;
    pan?: string;
    bankAccount?: string;
    ifscCode?: string;
    accountName?: string;
  };

  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const role = body.role ?? "CUSTOMER";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  if (role === "VENDOR") {
    if (!body.companyName || !body.gstin || !body.pan || !body.bankAccount || !body.ifscCode) {
      return NextResponse.json({ error: "Complete vendor business fields" }, { status: 400 });
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = await bcrypt.hash(otp, 10);
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.pendingRegistration.upsert({
    where: { email },
    create: {
      email,
      otpHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      passwordHash,
      role,
      name: body.name ?? null,
      phone: body.phone ?? null,
      companyName: body.companyName ?? null,
      gstin: body.gstin ?? null,
      pan: body.pan ?? null,
      bankAccount: body.bankAccount ?? null,
      ifscCode: body.ifscCode ?? null,
      accountName: body.accountName ?? null,
    },
    update: {
      otpHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      passwordHash,
      role,
      name: body.name ?? null,
      phone: body.phone ?? null,
      companyName: body.companyName ?? null,
      gstin: body.gstin ?? null,
      pan: body.pan ?? null,
      bankAccount: body.bankAccount ?? null,
      ifscCode: body.ifscCode ?? null,
      accountName: body.accountName ?? null,
    },
  });

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = getResend();
      await resend.emails.send({
        from: fromEmail(),
        to: email,
        subject: "Your Rentfoxxy verification code",
        html: `<p>Your verification code is <strong>${otp}</strong></p><p>It expires in 15 minutes.</p>`,
      });
    } catch {
      return NextResponse.json({ error: "Could not send email" }, { status: 502 });
    }
  } else {
    console.info(`[dev] OTP for ${email}: ${otp}`);
  }

  return NextResponse.json({
    ok: true,
    devOtp: process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY ? otp : undefined,
  });
}
