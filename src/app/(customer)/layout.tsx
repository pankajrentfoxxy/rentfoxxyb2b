import { CustomerAppShell } from "@/components/customer/CustomerAppShell";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  return (
    <CustomerAppShell email={session.user.email} role={session.user.role}>
      {children}
    </CustomerAppShell>
  );
}
