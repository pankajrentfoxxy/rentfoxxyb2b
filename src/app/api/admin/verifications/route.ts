import { getVerificationConsoleUserId } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const uid = await getVerificationConsoleUserId();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.verificationTask.findMany({
    orderBy: { createdAt: "desc" },
    include: { vendor: { select: { companyName: true } }, inspector: { select: { name: true } } },
    take: 200,
  });
  return NextResponse.json({ tasks });
}
