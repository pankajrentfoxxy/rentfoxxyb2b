import { auth } from "@/lib/auth";

export async function getAdminUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") return null;
  return session.user.id;
}

/** Admin or inspection manager (verification console). */
export async function getVerificationConsoleUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (session.user.role === "ADMIN" || session.user.role === "INSPECTION_MANAGER") return session.user.id;
  return null;
}
