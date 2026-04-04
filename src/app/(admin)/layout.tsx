import { AdminAppShell } from "@/components/admin/AdminAppShell";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  if (session.user.role !== "ADMIN") {
    if (session.user.role === "CUSTOMER") redirect("/customer/dashboard");
    if (session.user.role === "VENDOR") redirect("/vendor/dashboard");
    redirect("/");
  }
  return (
    <AdminAppShell email={session.user.email} role={session.user.role}>
      {children}
    </AdminAppShell>
  );
}
