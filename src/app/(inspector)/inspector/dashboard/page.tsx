import { getInspectorContext } from "@/lib/inspector-auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InspectorDashboardPage() {
  const ctx = await getInspectorContext();
  if (!ctx) redirect("/inspector/login");

  const tasks = await prisma.verificationTask.findMany({
    where: ctx.isManager ? {} : { inspectorId: ctx.inspectorId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      vendor: { select: { companyName: true } },
      inspector: { select: { name: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Inspector dashboard</h1>
      <p className="mt-1 text-sm text-muted">
        {ctx.isManager ? "All verification tasks" : "Your assigned verification visits"}
      </p>
      <ul className="mt-6 space-y-3">
        {tasks.map((t) => (
          <li key={t.id} className="rounded-xl border border-indigo-100 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-900">
                  {t.listingType}
                </span>
                <p className="mt-1 font-medium text-slate-900">{t.vendor.companyName}</p>
                <p className="text-xs text-muted">
                  Task {t.id.slice(0, 8)}… · {t.status}
                  {ctx.isManager && t.inspector?.name ? ` · ${t.inspector.name}` : ""}
                </p>
              </div>
              <Link
                href={`/inspector/tasks/${t.id}`}
                className="text-sm font-semibold text-indigo-700 hover:underline"
              >
                Open
              </Link>
            </div>
          </li>
        ))}
        {tasks.length === 0 ? (
          <p className="text-sm text-muted">No tasks {ctx.isManager ? "in the queue" : "assigned yet"}.</p>
        ) : null}
      </ul>
    </div>
  );
}
