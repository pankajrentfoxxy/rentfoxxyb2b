import { VerificationOtpEmail } from "@/emails/VerificationOtpEmail";
import { sendEmail } from "@/lib/email";
import { generateOTP, includeDevOtpInApiResponse, saveOTP } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as React from "react";

export const dynamic = "force-dynamic";

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email || !emailOk(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "No account for this email" }, { status: 404 });
  }
  if (user.isVerified) {
    return NextResponse.json({ error: "Already verified" }, { status: 400 });
  }

  const otp = generateOTP();
  await saveOTP(email, otp);

  if (process.env.RESEND_API_KEY) {
    try {
      await sendEmail({
        to: email,
        subject: `Your Rentfoxxy verification code: ${otp}`,
        react: React.createElement(VerificationOtpEmail, { otp }),
        throwOnError: true,
      });
    } catch (err) {
      console.error("[send-otp] Resend send failed:", err);
      return NextResponse.json({ error: "Could not send email" }, { status: 502 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Email not configured" }, { status: 503 });
  }

  if (includeDevOtpInApiResponse()) {
    console.info(`[dev] OTP for ${email}: ${otp}`);
  }

  const showDev = includeDevOtpInApiResponse();
  return NextResponse.json({
    ok: true,
    devOtp: showDev ? otp : undefined,
  });
}
