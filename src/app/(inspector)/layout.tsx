import { InspectorAppShell } from "@/components/inspector/InspectorAppShell";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function InspectorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/inspector/login");
  if (session.user.role === "INSPECTION_MANAGER") {
    return (
      <InspectorAppShell
        email={session.user.email ?? ""}
        name="Inspection manager"
        role={session.user.role}
      >
        {children}
      </InspectorAppShell>
    );
  }
  if (session.user.role !== "INSPECTOR") {
    redirect(session.user.role === "ADMIN" ? "/admin/dashboard" : "/");
  }
  const inspector = await prisma.inspector.findUnique({
    where: { userId: session.user.id },
  });
  if (!inspector) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold text-slate-900">Inspector profile missing</h1>
        <p className="mt-2 text-muted">Ask an admin to create your inspector account.</p>
      </div>
    );
  }
  return (
    <InspectorAppShell email={session.user.email} name={inspector.name} role={session.user.role}>
      {children}
    </InspectorAppShell>
  );
}
