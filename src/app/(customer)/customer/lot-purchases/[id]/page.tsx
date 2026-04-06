import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LotPurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const { id } = await params;

  const profile = await prisma.customerProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) notFound();

  const purchase = await prisma.lotPurchase.findFirst({
    where: { id, customerId: profile.id },
    include: { lot: { select: { title: true, totalLots: true, lotsSold: true } } },
  });
  if (!purchase) notFound();

  const balance =
    purchase.grandTotal != null && purchase.tokenAmount != null
      ? Math.round((purchase.grandTotal - purchase.tokenAmount) * 100) / 100
      : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <nav className="mb-4 text-sm text-muted">
        <Link href="/customer/dashboard" className="text-accent hover:underline">
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <span>Lot purchase</span>
      </nav>
      <h1 className="text-xl font-bold text-slate-900">{purchase.lot.title}</h1>
      {purchase.reference ? (
        <p className="mt-1 text-sm text-muted">Reference: {purchase.reference}</p>
      ) : null}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <p>
          Status: <strong>{purchase.status}</strong>
        </p>
        <p className="mt-2">
          Lots: {purchase.lotsCount} · Units: {purchase.totalUnits}
        </p>
        {purchase.grandTotal != null ? (
          <p className="mt-2">Grand total: ₹{purchase.grandTotal.toLocaleString("en-IN")}</p>
        ) : null}
        {purchase.status === "TOKEN_PAID" && balance != null && purchase.balanceDueAt ? (
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-amber-950">
            <p className="font-semibold">Balance due</p>
            <p>₹{balance.toLocaleString("en-IN")} by {purchase.balanceDueAt.toLocaleString("en-IN")}</p>
            <p className="mt-2 text-xs text-amber-800">
              Balance checkout for lots is coming soon — contact support or pay via link from your account
              manager.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
