import { getInspectorContext } from "@/lib/inspector-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getInspectorContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const baseWhere = ctx.isManager ? { id } : { id, inspectorId: ctx.inspectorId };
  const task = await prisma.verificationTask.findFirst({
    where: baseWhere,
    include: {
      vendor: true,
      inspector: { select: { id: true, name: true, type: true } },
    },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let lotItems: Awaited<ReturnType<typeof prisma.lotInventoryItem.findMany>> | null = null;
  let asasItems: Awaited<ReturnType<typeof prisma.asAsInventoryItem.findMany>> | null = null;
  if (task.listingType === "LOT") {
    lotItems = await prisma.lotInventoryItem.findMany({
      where: { lotId: task.listingId },
      orderBy: [{ brand: "asc" }, { model: "asc" }],
    });
  } else if (task.listingType === "ASAS") {
    asasItems = await prisma.asAsInventoryItem.findMany({
      where: { asasId: task.listingId },
      orderBy: [{ brand: "asc" }, { model: "asc" }],
    });
  }

  const listing =
    task.listingType === "LOT"
      ? await prisma.lotListing.findUnique({
          where: { id: task.listingId },
          select: { title: true, description: true, status: true },
        })
      : task.listingType === "ASAS"
        ? await prisma.asAsListing.findUnique({
            where: { id: task.listingId },
            select: { title: true, description: true, status: true },
          })
        : null;

  return NextResponse.json({
    task,
    listing,
    lotItems,
    asasItems,
  });
}
