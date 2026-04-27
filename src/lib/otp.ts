import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/** When true, OTP endpoints may return `devOtp` and log the code. True for `next dev` always; never in production. */
export function includeDevOtpInApiResponse(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.NODE_ENV === "development") return true;
  return !process.env.RESEND_API_KEY;
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Stores a bcrypt hash of the OTP (column name `otp` matches PRD; value is hashed). */
export async function saveOTP(email: string, plainOtp: string) {
  const otp = await bcrypt.hash(plainOtp, 10);
  await prisma.otpVerification.upsert({
    where: { email },
    update: { otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000), attempts: 0 },
    create: { email, otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000), attempts: 0 },
  });
}

export async function verifyOTP(email: string, inputOtp: string): Promise<boolean> {
  const record = await prisma.otpVerification.findUnique({ where: { email } });
  if (!record) return false;
  if (record.expiresAt < new Date()) {
    await prisma.otpVerification.delete({ where: { email } });
    return false;
  }
  if (record.attempts >= 3) return false;
  const ok = await bcrypt.compare(inputOtp, record.otp);
  if (!ok) {
    await prisma.otpVerification.update({ where: { email }, data: { attempts: { increment: 1 } } });
    return false;
  }
  await prisma.otpVerification.delete({ where: { email } });
  return true;
}
