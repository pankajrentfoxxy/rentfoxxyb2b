import { getVendorContext } from "@/lib/vendor-auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function VendorLotsPage() {
  const ctx = await getVendorContext();
  if (!ctx) return null;

  const lots = await prisma.lotListing.findMany({
    where: { vendorId: ctx.vendorId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lot sales</h1>
          <p className="mt-1 text-sm text-muted">Bulk inventory listings</p>
        </div>
        <Link
          href="/vendor/lots/new"
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
        >
          New lot
        </Link>
      </div>
      <ul className="mt-6 space-y-3">
        {lots.map((l) => (
          <li key={l.id} className="rounded-xl border border-teal-100 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{l.title}</p>
                <p className="text-xs text-muted">
                  {l.status} · {l.lotsSold}/{l.totalLots} lots · ₹{l.pricePerLot.toLocaleString("en-IN")}/lot
                </p>
              </div>
              <Link href={`/vendor/lots/${l.id}`} className="text-sm font-medium text-accent hover:underline">
                Manage
              </Link>
            </div>
          </li>
        ))}
        {lots.length === 0 ? <p className="text-sm text-muted">No lots yet.</p> : null}
      </ul>
    </div>
  );
}
