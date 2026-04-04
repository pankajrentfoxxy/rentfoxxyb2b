import { AdminVendorControls } from "@/components/admin/AdminVendorControls";
import { PAYMENT_METHOD_CONFIG, type PaymentMethodId } from "@/constants/payment-methods";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminVendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await prisma.vendorProfile.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, name: true, phone: true, createdAt: true, isVerified: true } },
      listings: { include: { product: { select: { name: true, slug: true } } } },
    },
  });
  if (!v) notFound();

  const orders = await prisma.order.findMany({
    where: { items: { some: { listing: { vendorId: v.id } } } },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      status: true,
      createdAt: true,
    },
  });

  const payouts = await prisma.payout.findMany({
    where: { vendorId: v.id },
    orderBy: { createdAt: "desc" },
    take: 25,
    include: { order: { select: { orderNumber: true } } },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <Link href="/admin/vendors" className="text-sm text-accent hover:underline">
          ← Vendors
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{v.companyName}</h1>
        <p className="text-sm text-muted">{v.user.email}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Overview</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">GSTIN</dt>
                <dd className="font-mono text-xs">{v.gstin}</dd>
              </div>
              <div>
                <dt className="text-muted">PAN</dt>
                <dd className="font-mono text-xs">{v.pan}</dd>
              </div>
              <div>
                <dt className="text-muted">Status</dt>
                <dd>{v.status}</dd>
              </div>
              <div>
                <dt className="text-muted">Approved</dt>
                <dd>{v.approvedAt ? v.approvedAt.toLocaleString("en-IN") : "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Bank</dt>
                <dd className="text-xs">
                  {v.accountName} ·
                  {v.bankAccount.length >= 4 ? ` ****${v.bankAccount.slice(-4)}` : ` ${v.bankAccount}`} ·{" "}
                  {v.ifscCode}
                </dd>
              </div>
              <div>
                <dt className="text-muted">User verified</dt>
                <dd>{v.user.isVerified ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Payment preferences (read-only)</h2>
            <p className="mt-1 text-xs text-muted">Set by the vendor in their profile. Used for bids and checkout rules.</p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-muted">Accepted methods</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {(v.acceptedPaymentMethods as string[]).length ? (
                    (v.acceptedPaymentMethods as PaymentMethodId[]).map((id) => (
                      <span
                        key={id}
                        className="rounded-full border border-slate-200 bg-surface px-2 py-0.5 text-xs font-medium text-slate-800"
                      >
                        {PAYMENT_METHOD_CONFIG[id]?.label ?? id}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Full advance only</dt>
                <dd>{v.requiresFullAdvance ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-muted">NEFT/RTGS above (₹)</dt>
                <dd>
                  {v.minOrderForRTGS != null
                    ? `≥ ₹${Number(v.minOrderForRTGS).toLocaleString("en-IN")}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Min. token %</dt>
                <dd>{v.minTokenPercentage}%</dd>
              </div>
              <div>
                <dt className="text-muted">Accepts token on bids</dt>
                <dd>{v.acceptsTokenPayment ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Listings ({v.listings.length})</h2>
            <ul className="mt-2 max-h-56 divide-y divide-slate-100 overflow-y-auto text-sm">
              {v.listings.map((l) => (
                <li key={l.id} className="py-2">
                  {l.product.name}{" "}
                  <Link className="text-accent hover:underline" href={`/admin/products/${l.productId}`}>
                    (admin)
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Recent orders</h2>
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {orders.map((o) => (
                <li key={o.id} className="flex justify-between py-2">
                  <Link href={`/admin/orders/${o.id}`} className="font-mono text-accent hover:underline">
                    {o.orderNumber}
                  </Link>
                  <span className="text-muted">{o.status}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Payouts</h2>
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {payouts.map((p) => (
                <li key={p.id} className="flex justify-between py-2">
                  <span>
                    {p.order.orderNumber} · {p.status}
                  </span>
                  <span>₹{p.netAmount.toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <AdminVendorControls vendorId={v.id} status={v.status} commissionRate={v.commissionRate} />
      </div>

      <section className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-semibold text-slate-900">Documents</h2>
        <p className="mt-1 text-xs text-muted">Certificate uploads can be wired to UploadThing in a later phase.</p>
      </section>
    </div>
  );
}
