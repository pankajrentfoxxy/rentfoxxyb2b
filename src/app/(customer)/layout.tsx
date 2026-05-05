import { CustomerAppShell } from "@/components/customer/CustomerAppShell";
import { customerWatchReachedCount } from "@/lib/customer-watch";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  if (session.user.role !== "CUSTOMER") {
    if (session.user.role === "VENDOR") redirect("/vendor/dashboard");
    if (session.user.role === "ADMIN" || session.user.role === "INSPECTION_MANAGER") redirect("/admin/dashboard");
    if (session.user.role === "INSPECTOR") redirect("/inspector/dashboard");
    redirect("/");
  }

  const watchAlertCount = await customerWatchReachedCount(session.user.id);

  return (
    <CustomerAppShell email={session.user.email} role={session.user.role} watchAlertCount={watchAlertCount}>
      {children}
    </CustomerAppShell>
  );
}
