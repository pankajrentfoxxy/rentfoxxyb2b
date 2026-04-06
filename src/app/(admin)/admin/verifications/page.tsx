import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminVerificationsPage() {
  const tasks = await prisma.verificationTask.findMany({
    orderBy: { createdAt: "desc" },
    include: { vendor: { select: { companyName: true } }, inspector: { select: { name: true } } },
    take: 150,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Verifications</h1>
      <p className="mt-1 text-sm text-muted">Physical verification workflow</p>
      <div className="mt-6 space-y-3">
        {tasks.map((t) => (
          <Link
            key={t.id}
            href={`/admin/verifications/${t.id}`}
            className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-accent"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold">{t.listingType}</span>
                <p className="mt-1 font-medium text-slate-900">{t.vendor.companyName}</p>
                <p className="text-xs text-muted">{t.status}</p>
              </div>
              <span className="text-sm font-medium text-accent">Manage →</span>
            </div>
          </Link>
        ))}
        {tasks.length === 0 ? <p className="text-sm text-muted">No tasks.</p> : null}
      </div>
    </div>
  );
}
