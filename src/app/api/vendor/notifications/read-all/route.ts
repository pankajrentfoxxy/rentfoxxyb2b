import { getVendorContext } from "@/lib/vendor-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT() {
  const ctx = await getVendorContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: { userId: ctx.userId, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
