import { getVendorContext } from "@/lib/vendor-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const vctx = await getVendorContext();
  if (!vctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const n = await prisma.notification.findFirst({
    where: { id, userId: vctx.userId },
  });
  if (!n) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.notification.update({
    where: { id: n.id },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
