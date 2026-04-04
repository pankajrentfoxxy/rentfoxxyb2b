import { getAdminUserId } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const adminId = await getAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const n = await prisma.notification.findFirst({ where: { id, userId: adminId } });
  if (!n) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.notification.update({ where: { id: n.id }, data: { isRead: true } });
  return NextResponse.json({ ok: true });
}
