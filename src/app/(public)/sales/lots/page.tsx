import { EmptyState } from "@/components/shared/EmptyState";
import { prisma } from "@/lib/prisma";
import { PackageSearch } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PublicLotsIndexPage() {
  const lots = await prisma.lotListing.findMany({
    where: { status: "LIVE" },
    orderBy: [{ lotsSold: "desc" }, { createdAt: "desc" }],
    take: 48,
    include: { vendor: { select: { companyName: true } } },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Bulk lot sales</h1>
      <p className="mt-2 text-muted">Verified bulk laptop inventory</p>
      {lots.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={PackageSearch}
          title="No lot sales live right now"
          description="New verified lots appear here once vendors publish and pass review. Check back soon or browse standard products."
          cta={{ label: "Browse products", href: "/products" }}
        />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lots.map((l) => (
            <Link
              key={l.id}
              href={`/sales/lots/${l.id}`}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-accent"
            >
              <p className="font-semibold text-slate-900">{l.title}</p>
              <p className="mt-1 text-xs text-muted">{l.vendor.companyName}</p>
              <p className="mt-3 text-sm">
                {l.lotsSold}/{l.totalLots} lots · ₹{l.pricePerLot.toLocaleString("en-IN")}/lot ({l.lotSize}{" "}
                units)
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
