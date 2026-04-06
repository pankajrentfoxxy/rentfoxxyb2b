import { getVerificationConsoleUserId } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const uid = await getVerificationConsoleUserId();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await req.json()) as { inspectorId?: string | null };
  const task = await prisma.verificationTask.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.verificationTask.update({
    where: { id },
    data: {
      inspectorId: body.inspectorId ?? null,
      status: body.inspectorId ? "ASSIGNED" : "PENDING_ASSIGNMENT",
    },
  });

  return NextResponse.json({ ok: true });
}
