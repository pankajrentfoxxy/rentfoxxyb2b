import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VendorVerificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "VENDOR") redirect("/auth/login");
  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: session.user.id } });
  if (!vendor) notFound();

  const task = await prisma.verificationTask.findFirst({
    where: { id, vendorId: vendor.id },
  });
  if (!task) notFound();

  return (
    <div className="space-y-4">
      <Link href="/vendor/listings/verifications" className="text-sm text-accent hover:underline">
        ← Back
      </Link>
      <h1 className="text-xl font-bold text-slate-900">Verification</h1>
      <p className="text-sm text-muted">
        {task.listingType} · {task.status}
      </p>
      <p className="text-sm text-slate-700">
        When slots are proposed, you&apos;ll confirm a visit window here (workflow extension).
      </p>
    </div>
  );
}
