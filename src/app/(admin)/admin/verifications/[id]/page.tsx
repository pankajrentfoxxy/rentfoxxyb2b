import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VerificationConsoleActions } from "@/components/admin/VerificationConsoleActions";

export const dynamic = "force-dynamic";

export default async function AdminVerificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await prisma.verificationTask.findUnique({
    where: { id },
    include: { vendor: true, inspector: true },
  });
  if (!task) notFound();

  const inspectors = await prisma.inspector.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <Link href="/admin/verifications" className="text-sm font-medium text-accent hover:underline">
        ← All verifications
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Verification task</h1>
        <p className="mt-1 text-sm text-muted">
          {task.listingType} · {task.status}
        </p>
      </div>
      <VerificationConsoleActions taskId={task.id} taskStatus={task.status} inspectors={inspectors} />
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <p>
          <strong>Vendor:</strong> {task.vendor.companyName}
        </p>
        <p className="mt-2">
          <strong>Listing id:</strong> {task.listingId}
        </p>
      </div>
    </div>
  );
}
