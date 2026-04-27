import { saveSmsOTP } from "@/lib/phone-otp";
import { prisma } from "@/lib/prisma";
import { generateOTP, includeDevOtpInApiResponse } from "@/lib/otp";
import { sendSMSOTP } from "@/lib/sms";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function norm10(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return d.slice(2);
  return d.slice(-10);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { email?: string; phone?: string };
  const email = body.email?.trim().toLowerCase();
  const phoneRaw = body.phone?.trim();
  if (!email || !phoneRaw) {
    return NextResponse.json({ error: "Email and phone required" }, { status: 400 });
  }

  const phone10 = norm10(phoneRaw);
  if (!/^[6-9]\d{9}$/.test(phone10)) {
    return NextResponse.json({ error: "Enter a valid 10-digit Indian mobile number" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      customerProfile: { select: { id: true } },
      vendorProfile: { select: { id: true } },
    },
  });
  if (!user?.emailVerified) {
    return NextResponse.json({ error: "Verify your email first" }, { status: 400 });
  }
  if (user.customerProfile || user.vendorProfile) {
    return NextResponse.json({ error: "Account already completed" }, { status: 400 });
  }

  const other = await prisma.user.findFirst({
    where: {
      phone: phone10,
      NOT: { email },
    },
    select: { id: true },
  });
  if (other) {
    return NextResponse.json({ error: "This number is already linked to another account" }, { status: 409 });
  }

  const otp = generateOTP();
  await saveSmsOTP(email, phone10, otp);
  const { ok, mocked } = await sendSMSOTP(phone10, otp);
  if (!ok) {
    return NextResponse.json({ error: "Could not send SMS" }, { status: 502 });
  }

  const showDev = includeDevOtpInApiResponse();
  return NextResponse.json({
    success: true,
    /** True when no real SMS was sent (local dev or MSG91 not configured in production). */
    smsMocked: mocked,
    devOtp: showDev ? otp : undefined,
  });
}
