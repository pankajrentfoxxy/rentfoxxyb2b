import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function VendorOrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!vendor) redirect("/auth/login");

  const orders = await prisma.order.findMany({
    where: { items: { some: { listing: { vendorId: vendor.id } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      items: { include: { listing: { include: { product: { select: { name: true } } } } } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-muted">Orders that include at least one of your SKUs.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-surface">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-800">Order</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Your lines</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Your total</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                const mine = o.items.filter((i) => i.listing.vendorId === vendor.id);
                const sub = mine.reduce((s, i) => s + i.subtotal, 0);
                const label = mine.map((i) => `${i.listing.product.name} ×${i.quantity}`).join("; ");
                return (
                  <tr key={o.id} className="bg-white hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <Link href={`/vendor/orders/${o.id}`} className="font-semibold text-accent hover:underline">
                        {o.orderNumber}
                      </Link>
                      <p className="text-xs text-muted">{new Date(o.createdAt).toLocaleString("en-IN")}</p>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs text-slate-700">{label}</td>
                    <td className="px-4 py-3 font-medium">₹{sub.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-slate-800">
                        {o.status.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
