import { getVendorContext } from "@/lib/vendor-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getVendorContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [vendor, user] = await Promise.all([
    prisma.vendorProfile.findUnique({
      where: { id: ctx.vendorId },
      select: {
        id: true,
        companyName: true,
        gstin: true,
        pan: true,
        bankAccount: true,
        ifscCode: true,
        accountName: true,
        commissionRate: true,
        status: true,
        approvedAt: true,
        acceptedPaymentMethods: true,
        requiresFullAdvance: true,
        minOrderForRTGS: true,
        minTokenPercentage: true,
        acceptsTokenPayment: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { email: true, name: true, phone: true },
    }),
  ]);

  if (!vendor || !user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ vendor, user });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getVendorContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    companyName?: string;
    bankAccount?: string;
    ifscCode?: string;
    accountName?: string;
    pan?: string;
  };

  const data: Record<string, string> = {};
  if (body.companyName?.trim()) data.companyName = body.companyName.trim();
  if (body.bankAccount?.trim()) data.bankAccount = body.bankAccount.trim();
  if (body.ifscCode?.trim()) data.ifscCode = body.ifscCode.trim().toUpperCase();
  if (body.accountName?.trim()) data.accountName = body.accountName.trim();
  if (body.pan?.trim()) data.pan = body.pan.trim().toUpperCase();

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const updated = await prisma.vendorProfile.update({
    where: { id: ctx.vendorId },
    data,
    select: {
      companyName: true,
      bankAccount: true,
      ifscCode: true,
      accountName: true,
      pan: true,
    },
  });

  return NextResponse.json({ ok: true, vendor: updated });
}
