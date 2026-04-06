import { EmptyState } from "@/components/shared/EmptyState";
import { asasInventoryCap, asasUnitsAvailable } from "@/lib/asas-inventory";
import { prisma } from "@/lib/prisma";
import { Layers } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AsAsListingsPage() {
  const listings = await prisma.asAsListing.findMany({
    where: { status: "LIVE" },
    orderBy: { createdAt: "desc" },
    take: 48,
    include: {
      vendor: { select: { companyName: true } },
      items: { select: { count: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">AsAs deals</h1>
      <p className="mt-2 text-muted">As-available-as-is fleet clearance</p>
      {listings.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={Layers}
          title="No AsAs deals available right now"
          description="Mixed-fleet AsAs listings will show up here when vendors go live. Explore catalog products in the meantime."
          cta={{ label: "Browse products", href: "/products" }}
        />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => {
            const cap = asasInventoryCap(l, l.items);
            const avail = asasUnitsAvailable(l, l.items);
            return (
            <Link
              key={l.id}
              href={`/asas/listings/${l.id}`}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-accent"
            >
              <p className="font-semibold text-slate-900">{l.title}</p>
              <p className="mt-1 text-xs text-muted">{l.vendor.companyName}</p>
              <p className="mt-3 text-sm">
                {avail} / {cap} units · ~₹
                {l.avgUnitPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}/unit
              </p>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
