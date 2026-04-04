import { AdminBidRowActions } from "@/components/admin/AdminBidRowActions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminBidsPage() {
  const bids = await prisma.bid.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      customer: { include: { user: { select: { email: true, name: true } } } },
      listing: { include: { product: { select: { name: true } }, vendor: true } },
    },
  });

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bids</h1>
        <p className="mt-1 text-sm text-muted">Customer and vendor identifiers visible to admins only.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1024px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-surface text-xs font-semibold uppercase text-muted">
            <tr>
              <th className="px-3 py-3">Customer</th>
              <th className="px-3 py-3">Product</th>
              <th className="px-3 py-3">Vendor</th>
              <th className="px-3 py-3">Qty</th>
              <th className="px-3 py-3">Bid ₹</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Created</th>
              <th className="px-3 py-3">Expires</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bids.map((b) => (
              <tr key={b.id} className="bg-white hover:bg-slate-50/80">
                <td className="px-3 py-2 text-xs">
                  {b.customer.user.name ?? b.customer.user.email}
                  <br />
                  <span className="text-muted">{b.customer.companyName}</span>
                </td>
                <td className="px-3 py-2">{b.listing.product.name}</td>
                <td className="px-3 py-2 text-xs">
                  <Link href={`/admin/vendors/${b.listing.vendorId}`} className="text-accent hover:underline">
                    {b.listing.vendor.companyName}
                  </Link>
                </td>
                <td className="px-3 py-2">{b.quantity}</td>
                <td className="px-3 py-2">₹{b.bidPricePerUnit.toLocaleString("en-IN")}</td>
                <td className="px-3 py-2 text-xs">{b.status}</td>
                <td className="px-3 py-2 text-xs text-muted">{b.createdAt.toLocaleString("en-IN")}</td>
                <td className="px-3 py-2 text-xs text-muted">{b.expiresAt ? b.expiresAt.toLocaleString("en-IN") : "—"}</td>
                <td className="px-3 py-2">
                  <AdminBidRowActions bidId={b.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
