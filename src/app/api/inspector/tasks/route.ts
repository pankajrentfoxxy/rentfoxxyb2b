import { getInspectorContext } from "@/lib/inspector-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getInspectorContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.verificationTask.findMany({
    where: ctx.isManager ? {} : { inspectorId: ctx.inspectorId },
    orderBy: { updatedAt: "desc" },
    include: { vendor: { select: { companyName: true, gstin: true } } },
    take: 100,
  });

  return NextResponse.json({ tasks });
}
