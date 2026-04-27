import { OTPEmail } from "@/emails/OTPEmail";
import { sendEmail } from "@/lib/email";
import { generateOTP, includeDevOtpInApiResponse, saveOTP } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import * as React from "react";

export const dynamic = "force-dynamic";

function strongPassword(pw: string): boolean {
  if (pw.length < 8) return false;
  if (!/[A-Z]/.test(pw)) return false;
  if (!/[0-9]/.test(pw)) return false;
  if (!/[^A-Za-z0-9]/.test(pw)) return false;
  return true;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    email?: string;
    name?: string;
    password?: string;
    role?: Role;
  };

  const email = body.email?.trim().toLowerCase();
  const name = body.name?.trim() || null;
  const password = body.password;
  const role = body.role === "VENDOR" ? Role.VENDOR : Role.CUSTOMER;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  if (!strongPassword(password)) {
    return NextResponse.json(
      {
        error:
          "Password must be at least 8 characters and include an uppercase letter, a number, and a special character.",
      },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    include: {
      customerProfile: { select: { id: true } },
      vendorProfile: { select: { id: true } },
    },
  });

  if (existing?.customerProfile || existing?.vendorProfile) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const otp = generateOTP();
  await saveOTP(email, otp);

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        name,
        role,
        emailVerified: null,
        phone: null,
        phoneVerified: null,
        isVerified: false,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        emailVerified: null,
        isVerified: false,
      },
    });
  }

  if (process.env.RESEND_API_KEY) {
    try {
      await sendEmail({
        to: email,
        subject: "Verify your Rentfoxxy account",
        react: React.createElement(OTPEmail, { otp, purpose: "email_verify" }),
        throwOnError: true,
      });
    } catch (err) {
      console.error("[register/init] Resend send failed:", err);
      return NextResponse.json({ error: "Could not send email" }, { status: 502 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Email verification is not configured (RESEND_API_KEY)." },
      { status: 503 },
    );
  }

  if (includeDevOtpInApiResponse()) {
    console.info(`[dev] Registration email OTP for ${email}: ${otp}`);
  }

  const showDev = includeDevOtpInApiResponse();
  return NextResponse.json({
    success: true,
    message: "OTP sent",
    devOtp: showDev ? otp : undefined,
  });
}
