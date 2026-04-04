import { getAdminUserId } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import type { VendorStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const adminId = await getAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await req.json()) as {
    status?: VendorStatus;
    commissionRate?: number;
  };

  const vendor = await prisma.vendorProfile.findUnique({ where: { id } });
  if (!vendor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: { status?: VendorStatus; commissionRate?: number; approvedAt?: Date | null } = {};

  if (body.status && ["PENDING_APPROVAL", "ACTIVE", "SUSPENDED"].includes(body.status)) {
    data.status = body.status;
    if (body.status === "ACTIVE") data.approvedAt = new Date();
    if (body.status === "PENDING_APPROVAL") data.approvedAt = null;
  }

  if (typeof body.commissionRate === "number" && Number.isFinite(body.commissionRate)) {
    data.commissionRate = Math.min(100, Math.max(0, body.commissionRate));
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  await prisma.vendorProfile.update({ where: { id }, data });

  return NextResponse.json({ ok: true });
}
