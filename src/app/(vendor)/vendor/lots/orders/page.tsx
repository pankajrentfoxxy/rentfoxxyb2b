import { AsAsDispatchForm } from "@/components/vendor/AsAsDispatchForm";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function VendorBulkOrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!vendor) redirect("/auth/login");

  const [pendingLots, pendingAsAs] = await Promise.all([
    prisma.lotListing.findMany({
      where: {
        vendorId: vendor.id,
        status: "SOLD_OUT",
        dispatchedAt: null,
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        purchases: {
          select: {
            id: true,
            reference: true,
            lotsCount: true,
            totalUnits: true,
          },
        },
      },
    }),
    prisma.asAsListing.findMany({
      where: {
        vendorId: vendor.id,
        status: "SOLD_OUT",
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        purchases: {
          select: { id: true, dispatchedAt: true },
        },
      },
    }),
  ]);

  const asAsNeedDispatch = pendingAsAs.filter((a) => a.purchases.some((p) => !p.dispatchedAt));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bulk sales fulfilment</h1>
        <p className="mt-1 text-sm text-muted">
          Sold-out lot listings and fully sold As-Is listings awaiting carrier and AWB. Product catalogue orders stay
          under <Link href="/vendor/orders" className="font-medium text-accent hover:underline">Orders</Link>.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Lot listings</h2>
        {pendingLots.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-muted">No sold-out lots pending dispatch.</p>
        ) : (
          <ul className="space-y-3">
            {pendingLots.map((lot) => (
              <li key={lot.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{lot.title}</p>
                    <p className="text-xs text-muted">
                      {lot.purchases.length} purchase(s) · {lot.totalQuantity} units · ref.{" "}
                      {lot.purchases
                        .map((p) => p.reference)
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </p>
                  </div>
                  <Link
                    href={`/vendor/lots/${lot.id}`}
                    className="shrink-0 rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-800"
                  >
                    Enter carrier &amp; dispatch
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">As-Is listings</h2>
        {asAsNeedDispatch.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-muted">
            No sold-out As-Is listings pending dispatch.
          </p>
        ) : (
          <div className="space-y-4">
            {asAsNeedDispatch.map((a) => (
              <AsAsDispatchForm key={a.id} asasId={a.id} title={a.title} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
