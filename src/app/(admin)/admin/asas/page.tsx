import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminAsAsPage() {
  const listings = await prisma.asAsListing.findMany({
    orderBy: { createdAt: "desc" },
    include: { vendor: { select: { companyName: true } } },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">AsAs listings</h1>
      <p className="mt-1 text-sm text-muted">As-available-as-is inventory</p>
      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Units</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{l.title}</td>
                <td className="px-4 py-3 text-muted">{l.vendor.companyName}</td>
                <td className="px-4 py-3">{l.status}</td>
                <td className="px-4 py-3">
                  {l.unitsSold}/{l.totalUnits}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/asas/${l.id}`} className="font-medium text-accent hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {listings.length === 0 ? <p className="p-6 text-sm text-muted">No AsAs listings yet.</p> : null}
      </div>
    </div>
  );
}
