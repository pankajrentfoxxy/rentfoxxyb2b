import { auth } from "@/lib/auth";

export async function getAdminUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") return null;
  return session.user.id;
}
