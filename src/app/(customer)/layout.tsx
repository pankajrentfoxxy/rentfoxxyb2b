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
  const watchAlertCount =
    session.user.role === "CUSTOMER"
      ? await customerWatchReachedCount(session.user.id)
      : 0;
  return (
    <CustomerAppShell
      email={session.user.email}
      role={session.user.role}
      watchAlertCount={watchAlertCount}
    >
      {children}
    </CustomerAppShell>
  );
}
