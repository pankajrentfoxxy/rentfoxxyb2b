import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function normPhone10(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return d.slice(2);
  if (d.length === 10) return d;
  return d;
}

export async function saveSmsOTP(email: string, phone10: string, plainOtp: string) {
  const phone = normPhone10(phone10);
  const otpHash = await bcrypt.hash(plainOtp, 10);
  await prisma.smsOtpVerification.upsert({
    where: { phone },
    update: {
      email: email.trim().toLowerCase(),
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
    },
    create: {
      phone,
      email: email.trim().toLowerCase(),
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
    },
  });
}

export async function verifySmsOTP(email: string, phone10: string, inputOtp: string): Promise<boolean> {
  const phone = normPhone10(phone10);
  const record = await prisma.smsOtpVerification.findUnique({ where: { phone } });
  if (!record) return false;
  if (record.email !== email.trim().toLowerCase()) return false;
  if (record.expiresAt < new Date()) {
    await prisma.smsOtpVerification.delete({ where: { phone } });
    return false;
  }
  if (record.attempts >= 5) return false;
  const ok = await bcrypt.compare(inputOtp, record.otpHash);
  if (!ok) {
    await prisma.smsOtpVerification.update({
      where: { phone },
      data: { attempts: { increment: 1 } },
    });
    return false;
  }
  await prisma.smsOtpVerification.delete({ where: { phone } });
  return true;
}
