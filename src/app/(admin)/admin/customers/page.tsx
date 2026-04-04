import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminCustomersPage() {
  const customers = await prisma.customerProfile.findMany({
    orderBy: { user: { createdAt: "desc" } },
    include: {
      user: { select: { email: true, name: true, createdAt: true, isVerified: true } },
      orders: { select: { totalAmount: true } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
        <p className="mt-1 text-sm text-muted">Buyer organisations and spend.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-surface text-xs font-semibold uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Total spend</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => {
              const spend = c.orders.reduce((s, o) => s + o.totalAmount, 0);
              return (
                <tr key={c.id} className="bg-white hover:bg-slate-50/80">
                  <td className="px-4 py-3">{c.user.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">{c.user.email}</td>
                  <td className="px-4 py-3">{c.companyName ?? "—"}</td>
                  <td className="px-4 py-3">{c.orders.length}</td>
                  <td className="px-4 py-3">₹{spend.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {c.user.createdAt.toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${c.id}`} className="text-accent hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
