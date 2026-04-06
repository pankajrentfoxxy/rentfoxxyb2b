import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InspectorDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const inspector = await prisma.inspector.findUnique({
    where: { userId: session.user.id },
  });
  if (!inspector) return null;

  const tasks = await prisma.verificationTask.findMany({
    where: { inspectorId: inspector.id },
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: { vendor: { select: { companyName: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Inspector dashboard</h1>
      <p className="mt-1 text-sm text-muted">Assigned verification visits</p>
      <ul className="mt-6 space-y-3">
        {tasks.map((t) => (
          <li key={t.id} className="rounded-xl border border-indigo-100 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-900">
                  {t.listingType}
                </span>
                <p className="mt-1 font-medium text-slate-900">{t.vendor.companyName}</p>
                <p className="text-xs text-muted">Task {t.id.slice(0, 8)}… · {t.status}</p>
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
        {tasks.length === 0 ? <p className="text-sm text-muted">No tasks assigned yet.</p> : null}
      </ul>
    </div>
  );
}
