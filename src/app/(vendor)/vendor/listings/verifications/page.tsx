import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VendorVerificationsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "VENDOR") redirect("/auth/login");

  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: session.user.id } });
  if (!vendor) redirect("/vendor/dashboard");

  const tasks = await prisma.verificationTask.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Listing verifications</h1>
      <p className="mt-1 text-sm text-muted">Status of physical verification for your inventory</p>
      <ul className="mt-6 space-y-3">
        {tasks.map((t) => (
          <li key={t.id} className="rounded-xl border border-teal-100 bg-white p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold">{t.listingType}</span>
                <p className="mt-1 text-sm text-muted">Listing {t.listingId.slice(0, 8)}…</p>
                <p className="text-sm font-medium text-slate-800">{t.status}</p>
              </div>
              <Link href={`/vendor/listings/verifications/${t.id}`} className="text-sm text-accent hover:underline">
                Details
              </Link>
            </div>
          </li>
        ))}
        {tasks.length === 0 ? <p className="text-sm text-muted">No verification tasks.</p> : null}
      </ul>
    </div>
  );
}
