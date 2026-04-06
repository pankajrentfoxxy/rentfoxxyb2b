import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AsAsPurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const { id } = await params;

  const profile = await prisma.customerProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) notFound();

  const purchase = await prisma.asAsPurchase.findFirst({
    where: { id, customerId: profile.id },
    include: { asas: { select: { title: true } } },
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
        <span>AsAs purchase</span>
      </nav>
      <h1 className="text-xl font-bold">{purchase.asas.title}</h1>
      {purchase.reference ? <p className="text-sm text-muted">Ref: {purchase.reference}</p> : null}
      <div className="mt-6 rounded-xl border bg-white p-4 text-sm">
        <p>
          Status: <strong>{purchase.status}</strong>
        </p>
        <p className="mt-2">Units: {purchase.quantity}</p>
        {purchase.grandTotal != null ? (
          <p className="mt-2">Total: ₹{purchase.grandTotal.toLocaleString("en-IN")}</p>
        ) : null}
        {purchase.status === "TOKEN_PAID" && balance != null && purchase.balanceDueAt ? (
          <div className="mt-4 rounded-lg bg-amber-50 p-3">
            <p className="font-semibold">Balance ₹{balance.toLocaleString("en-IN")}</p>
            <p className="text-xs">Due {purchase.balanceDueAt.toLocaleString("en-IN")}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
