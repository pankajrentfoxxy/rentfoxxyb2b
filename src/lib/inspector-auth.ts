import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getInspectorContext(): Promise<{ userId: string; inspectorId: string } | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "INSPECTOR") return null;
  const row = await prisma.inspector.findUnique({ where: { userId: session.user.id } });
  if (!row?.isActive) return null;
  return { userId: session.user.id, inspectorId: row.id };
}
