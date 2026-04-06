import { getVerificationConsoleUserId } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const uid = await getVerificationConsoleUserId();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const task = await prisma.verificationTask.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (task.status === "APPROVED" || task.status === "REJECTED" || task.status === "CANCELLED") {
    return NextResponse.json({ error: "Task already closed" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.verificationTask.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    if (task.listingType === "PRODUCT_LISTING") {
      await tx.productListing.update({
        where: { id: task.listingId },
        data: { isActive: true },
      });
    } else if (task.listingType === "LOT") {
      await tx.lotListing.update({
        where: { id: task.listingId },
        data: { status: "VERIFIED" },
      });
    } else if (task.listingType === "ASAS") {
      await tx.asAsListing.update({
        where: { id: task.listingId },
        data: { status: "VERIFIED" },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
