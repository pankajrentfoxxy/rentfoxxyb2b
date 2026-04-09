import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type InspectorContext =
  | { userId: string; inspectorId: string; isManager: false }
  | { userId: string; inspectorId: null; isManager: true };

export async function getInspectorContext(): Promise<InspectorContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (session.user.role === "INSPECTION_MANAGER") {
    return { userId: session.user.id, inspectorId: null, isManager: true };
  }
  if (session.user.role !== "INSPECTOR") return null;
  const row = await prisma.inspector.findUnique({ where: { userId: session.user.id } });
  if (!row?.isActive) return null;
  return { userId: session.user.id, inspectorId: row.id, isManager: false };
}
