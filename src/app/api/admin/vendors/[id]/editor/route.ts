import { getAdminUserId } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import type { Prisma, VendorStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

/** Admin vendor editor: full read/update for the edit modal only. */

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const adminId = await getAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const vendor = await prisma.vendorProfile.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });
  if (!vendor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: vendor.id,
    email: vendor.user.email,
    companyName: vendor.companyName,
    gstin: vendor.gstin,
    pan: vendor.pan,
    bankAccount: vendor.bankAccount,
    ifscCode: vendor.ifscCode,
    accountName: vendor.accountName,
    commissionRate: vendor.commissionRate,
    status: vendor.status,
  });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const adminId = await getAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await req.json()) as {
    status?: VendorStatus;
    commissionRate?: number;
    companyName?: string;
    gstin?: string;
    pan?: string;
    bankAccount?: string;
    ifscCode?: string;
    accountName?: string;
    email?: string;
    newPassword?: string;
  };

  const vendor = await prisma.vendorProfile.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!vendor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const profileData: Prisma.VendorProfileUpdateInput = {};
  const userData: Prisma.UserUpdateInput = {};

  if (body.companyName !== undefined) {
    const c = body.companyName.trim();
    if (!c) return NextResponse.json({ error: "Company name required" }, { status: 400 });
    if (c !== vendor.companyName) profileData.companyName = c;
  }

  if (body.gstin !== undefined) {
    const g = body.gstin.trim();
    if (!g) return NextResponse.json({ error: "GSTIN required" }, { status: 400 });
    if (g !== vendor.gstin) {
      const clash = await prisma.vendorProfile.findFirst({
        where: { gstin: g, NOT: { id } },
      });
      if (clash) return NextResponse.json({ error: "GSTIN already registered" }, { status: 400 });
      profileData.gstin = g;
    }
  }

  if (body.pan !== undefined) {
    const p = body.pan.trim();
    const next = p || vendor.pan;
    if (next !== vendor.pan) profileData.pan = next;
  }

  if (body.bankAccount !== undefined) {
    const b = body.bankAccount.trim();
    if (b && b !== vendor.bankAccount) profileData.bankAccount = b;
  }

  if (body.ifscCode !== undefined) {
    const f = body.ifscCode.trim().toUpperCase();
    if (f && f !== vendor.ifscCode) profileData.ifscCode = f;
  }

  if (body.accountName !== undefined) {
    const a = body.accountName.trim();
    if (a && a !== vendor.accountName) profileData.accountName = a;
  }

  if (body.status && ["PENDING_APPROVAL", "ACTIVE", "SUSPENDED"].includes(body.status)) {
    if (body.status !== vendor.status) {
      profileData.status = body.status;
      if (body.status === "ACTIVE") profileData.approvedAt = new Date();
      if (body.status === "PENDING_APPROVAL") profileData.approvedAt = null;
    }
  }

  if (typeof body.commissionRate === "number" && Number.isFinite(body.commissionRate)) {
    const next = Math.min(100, Math.max(0, body.commissionRate));
    if (next !== vendor.commissionRate) profileData.commissionRate = next;
  }

  if (body.email !== undefined) {
    const e = body.email.trim().toLowerCase();
    if (!e) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    if (e !== vendor.user.email) {
      const taken = await prisma.user.findFirst({
        where: { email: e, NOT: { id: vendor.userId } },
      });
      if (taken) return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      userData.email = e;
    }
  }

  if (body.newPassword !== undefined && body.newPassword.length > 0) {
    if (body.newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    userData.passwordHash = await bcrypt.hash(body.newPassword, 12);
  }

  const hasProfileUpdates = Object.keys(profileData).length > 0;
  const hasUserUpdates = Object.keys(userData).length > 0;

  if (!hasProfileUpdates && !hasUserUpdates) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    if (hasUserUpdates) {
      await tx.user.update({ where: { id: vendor.userId }, data: userData });
    }
    if (hasProfileUpdates) {
      await tx.vendorProfile.update({ where: { id }, data: profileData });
    }
  });

  return NextResponse.json({ ok: true });
}
