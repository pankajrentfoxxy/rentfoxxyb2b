import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 400 });

  const { id } = await ctx.params;
  const w = await prisma.priceWatch.findFirst({
    where: { id, customerId: profile.id },
  });
  if (!w) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.priceWatch.update({
    where: { id },
    data: { isActive: false },
  });
  return NextResponse.json({ success: true });
}
