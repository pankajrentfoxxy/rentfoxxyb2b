import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InspectorTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();
  const inspector = await prisma.inspector.findUnique({ where: { userId: session.user.id } });
  if (!inspector) notFound();

  const task = await prisma.verificationTask.findFirst({
    where: { id, inspectorId: inspector.id },
    include: { vendor: true },
  });
  if (!task) notFound();

  return (
    <div className="max-w-2xl space-y-4">
      <Link href="/inspector/dashboard" className="text-sm font-medium text-indigo-700 hover:underline">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Verification task</h1>
      <p className="text-sm text-muted">
        Type: <strong>{task.listingType}</strong> · Status: <strong>{task.status}</strong>
      </p>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-medium text-slate-800">Vendor</p>
        <p className="text-slate-900">{task.vendor.companyName}</p>
        <p className="mt-2 text-sm text-muted">GSTIN {task.vendor.gstin}</p>
        {task.vendorAddress ? (
          <p className="mt-4 text-sm">
            <strong>Warehouse</strong>
            <br />
            {task.vendorAddress}
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted">Warehouse address pending from vendor.</p>
        )}
      </div>
      <p className="text-sm text-slate-600">
        Submit inspection notes via admin workflow for now; field report form can extend this page.
      </p>
    </div>
  );
}
