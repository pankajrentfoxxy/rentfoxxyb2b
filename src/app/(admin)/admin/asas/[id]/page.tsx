import { AdminAsAsActions } from "@/components/admin/AdminAsAsActions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminAsAsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await prisma.asAsListing.findUnique({
    where: { id },
    include: { vendor: true, items: true },
  });
  if (!listing) notFound();

  const task = await prisma.verificationTask.findFirst({
    where: { listingType: "ASAS", listingId: id },
  });

  return (
    <div className="space-y-6">
      <Link href="/admin/asas" className="text-sm font-medium text-accent hover:underline">
        ← All AsAs
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{listing.title}</h1>
        <p className="mt-1 text-sm text-muted">{listing.vendor.companyName} · {listing.status}</p>
      </div>
      <AdminAsAsActions
        asasId={listing.id}
        taskId={task?.id ?? null}
        listingStatus={listing.status}
        taskStatus={task?.status ?? null}
      />
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-800">Highlights</p>
        <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
          {listing.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
