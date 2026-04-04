import { AdminCustomerControls } from "@/components/admin/AdminCustomerControls";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.customerProfile.findUnique({
    where: { id },
    include: {
      user: true,
      orders: { orderBy: { createdAt: "desc" }, take: 30 },
      bids: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { listing: { include: { product: { select: { name: true } } } } },
      },
    },
  });
  if (!c) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Link href="/admin/customers" className="text-sm text-accent hover:underline">
          ← Customers
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{c.companyName ?? c.user.email}</h1>
        <p className="text-sm text-muted">{c.user.email}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">GSTIN</dt>
                <dd className="font-mono text-xs">{c.gstin ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Phone</dt>
                <dd>{c.user.phone ?? "—"}</dd>
              </div>
            </dl>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Orders</h2>
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {c.orders.map((o) => (
                <li key={o.id} className="flex justify-between py-2">
                  <Link href={`/admin/orders/${o.id}`} className="text-accent hover:underline">
                    {o.orderNumber}
                  </Link>
                  <span>
                    ₹{o.totalAmount.toLocaleString("en-IN")} · {o.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Bids</h2>
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {c.bids.map((b) => (
                <li key={b.id} className="flex justify-between py-2">
                  <span>{b.listing.product.name}</span>
                  <span>{b.status}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <AdminCustomerControls
          customerProfileId={c.id}
          isVerified={c.user.isVerified}
          gstVerified={c.gstVerified}
        />
      </div>
    </div>
  );
}
