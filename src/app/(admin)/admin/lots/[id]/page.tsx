import { AdminLotActions } from "@/components/admin/AdminLotActions";
import { AdminLotItemsTable } from "@/components/admin/AdminListingInventoryTables";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

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
      {lot.highlights.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-800">Highlights</p>
          <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
            {lot.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Inventory (post-cleaning)</h2>
        <p className="text-sm text-muted">
          Full table as uploaded after CSV cleaning / wizard · use horizontal scroll on small screens.
        </p>
        <AdminLotItemsTable items={[...lot.items].sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model))} />
      </section>
    </div>
  );
}
