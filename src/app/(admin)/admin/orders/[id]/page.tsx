import { AdminOrderInvoiceTools } from "@/components/admin/AdminOrderInvoiceTools";
import { AdminOrderOverride } from "@/components/admin/AdminOrderOverride";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: { include: { user: true } },
      address: true,
      payments: { orderBy: { id: "asc" } },
      invoices: { orderBy: { issuedAt: "asc" } },
      shipment: true,
      bid: true,
      items: {
        include: { listing: { include: { vendor: true, product: true } } },
      },
    },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Link href="/admin/orders" className="text-sm text-accent hover:underline">
          ← Orders
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{order.orderNumber}</h1>
        <p className="text-sm text-muted">{order.status.replace(/_/g, " ")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Customer</h2>
            <p className="mt-2 text-sm">
              {order.customer.user.name ?? order.customer.user.email}
              <br />
              <span className="text-muted">{order.customer.user.email}</span>
              <br />
              {order.customer.companyName} · GSTIN {order.customer.gstin ?? "—"}
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Ship to</h2>
            <p className="mt-2 text-sm">
              {order.address.line1}
              {order.address.line2 ? `, ${order.address.line2}` : ""}
              <br />
              {order.address.city}, {order.address.state} {order.address.pincode}
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Line items</h2>
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {order.items.map((i) => (
                <li key={i.id} className="flex flex-wrap justify-between gap-2 py-2">
                  <div>
                    <p className="font-medium">{i.listing.product.name}</p>
                    <p className="text-xs text-muted">
                      Vendor:{" "}
                      <Link href={`/admin/vendors/${i.listing.vendorId}`} className="text-accent hover:underline">
                        {i.listing.vendor.companyName}
                      </Link>{" "}
                      · SKU {i.listing.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    {i.quantity} × ₹{i.unitPrice.toLocaleString("en-IN")}
                    <p className="font-semibold">₹{i.subtotal.toLocaleString("en-IN")}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-right font-semibold">Total ₹{order.totalAmount.toLocaleString("en-IN")}</p>
          </section>

          {order.payments.length > 0 ? (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Payments</h2>
              <ul className="mt-2 space-y-2 text-sm text-muted">
                {order.payments.map((p) => (
                  <li key={p.id}>
                    {p.paymentPurpose.replace(/_/g, " ")} — {p.status} — ₹
                    {p.amount.toLocaleString("en-IN")} · Razorpay {p.razorpayOrderId}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {order.shipment ? (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Shipment</h2>
              <p className="mt-2 text-sm">
                {order.shipment.carrier} · AWB {order.shipment.awbNumber}
                {order.shipment.trackingUrl ? (
                  <>
                    {" "}
                    <a href={order.shipment.trackingUrl} className="text-accent hover:underline" target="_blank">
                      Track
                    </a>
                  </>
                ) : null}
              </p>
            </section>
          ) : null}

          {order.invoices.length ? (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Invoices</h2>
              <ul className="mt-2 space-y-2 text-sm">
                {order.invoices.map((inv) => (
                  <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <span className="font-mono text-xs">
                      {inv.invoiceNumber} · {inv.type}
                    </span>
                    <a
                      href={`/api/admin/invoices/${inv.id}/download`}
                      className="text-accent hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download PDF
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="space-y-4">
          <AdminOrderInvoiceTools orderId={order.id} status={order.status} />
          <AdminOrderOverride orderId={order.id} currentStatus={order.status} adminNotes={order.adminNotes} />
        </div>
      </div>
    </div>
  );
}
