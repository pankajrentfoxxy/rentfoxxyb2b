import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminLotActions } from "@/components/admin/AdminLotActions";

export const dynamic = "force-dynamic";

export default async function AdminLotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lot = await prisma.lotListing.findUnique({
    where: { id },
    include: { vendor: true, items: true },
  });
  if (!lot) notFound();

  const task = await prisma.verificationTask.findFirst({
    where: { listingType: "LOT", listingId: id },
  });

  return (
    <div className="space-y-6">
      <Link href="/admin/lots" className="text-sm font-medium text-accent hover:underline">
        ← All lots
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{lot.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {lot.vendor.companyName} · {lot.status}
        </p>
      </div>
      <AdminLotActions
        lotId={lot.id}
        lotStatus={lot.status}
        taskId={task?.id ?? null}
        taskStatus={task?.status ?? null}
      />
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-800">Inventory rows</p>
        <ul className="mt-2 max-h-64 overflow-y-auto text-sm text-slate-700">
          {lot.items.map((i) => (
            <li key={i.id}>
              {i.brand} {i.model} · {i.condition} · qty {i.count}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
