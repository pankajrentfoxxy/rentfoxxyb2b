import { getAdminUserId } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/** `id` = CustomerProfile.id */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const adminId = await getAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await req.json()) as { isVerified?: boolean; gstVerified?: boolean };

  const profile = await prisma.customerProfile.findUnique({ where: { id } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (typeof body.isVerified === "boolean") {
    await prisma.user.update({
      where: { id: profile.userId },
      data: { isVerified: body.isVerified },
    });
  }

  if (typeof body.gstVerified === "boolean") {
    await prisma.customerProfile.update({
      where: { id },
      data: { gstVerified: body.gstVerified },
    });
  }

  return NextResponse.json({ ok: true });
}
