import { getAdminUserId } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const adminId = await getAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const task = await prisma.verificationTask.findFirst({
    where: { listingType: "ASAS", listingId: id, status: "APPROVED" },
  });
  if (!task) {
    return NextResponse.json({ error: "AsAs must have an approved verification task first" }, { status: 400 });
  }

  await prisma.asAsListing.update({
    where: { id },
    data: { status: "LIVE" },
  });

  return NextResponse.json({ ok: true });
}
