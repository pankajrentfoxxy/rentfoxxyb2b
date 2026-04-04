import { getAdminUserId } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT() {
  const adminId = await getAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.notification.updateMany({
    where: { userId: adminId, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
