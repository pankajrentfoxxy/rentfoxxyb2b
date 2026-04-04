import { getAdminUserId } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import type { VendorStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const adminId = await getAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    email?: string;
    password?: string;
    companyName?: string;
    gstin?: string;
    pan?: string;
    bankAccount?: string;
    ifscCode?: string;
    accountName?: string;
    commissionRate?: number;
    status?: VendorStatus;
  };

  const email = body.email?.trim().toLowerCase();
  if (!email || !body.password || !body.companyName?.trim() || !body.gstin?.trim()) {
    return NextResponse.json({ error: "email, password, companyName, gstin required" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

  const gstClash = await prisma.vendorProfile.findUnique({ where: { gstin: body.gstin.trim() } });
  if (gstClash) return NextResponse.json({ error: "GSTIN already registered" }, { status: 400 });

  const hash = await bcrypt.hash(body.password, 12);
  const status = body.status ?? "PENDING_APPROVAL";
  const approvedAt = status === "ACTIVE" ? new Date() : null;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hash,
      role: "VENDOR",
      isVerified: true,
      vendorProfile: {
        create: {
          companyName: body.companyName.trim(),
          gstin: body.gstin.trim(),
          pan: (body.pan ?? "").trim() || "AAAAA0000A",
          bankAccount: (body.bankAccount ?? "").trim() || "000000000000",
          ifscCode: (body.ifscCode ?? "").trim().toUpperCase() || "HDFC0000000",
          accountName: (body.accountName ?? "").trim() || body.companyName.trim(),
          commissionRate: typeof body.commissionRate === "number" ? body.commissionRate : 8,
          status,
          approvedAt,
        },
      },
    },
    include: { vendorProfile: true },
  });

  return NextResponse.json({
    ok: true,
    vendorId: user.vendorProfile?.id,
    userId: user.id,
  });
}
