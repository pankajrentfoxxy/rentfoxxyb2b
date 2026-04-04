import { CustomerOrderReviewForm } from "@/components/customer/CustomerOrderReviewForm";
import { OrderPayBalanceClient } from "@/components/customer/OrderPayBalanceClient";
import { OrderStatusStepper } from "@/components/customer/OrderStatusStepper";
import { ReturnRequestButton } from "@/components/customer/ReturnRequestButton";
import { SupportTicketModal } from "@/components/customer/SupportTicketModal";
import { roundMoney } from "@/constants/payment-options";
import { auth } from "@/lib/auth";
import { gstBreakdown } from "@/lib/gst";
import { normalizePublicImagePath } from "@/lib/image-url";
import { isWithinDaysAfterDelivery, orderDeliveryAnchor } from "@/lib/order-delivery";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

const placeholder =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="#EEF2FF" width="80" height="80"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748B" font-size="10">Img</text></svg>`,
  );

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) notFound();

  const order = await prisma.order.findFirst({
    where: { id: params.id, customerId: profile.id },
    include: {
      items: {
        include: {
          listing: { include: { product: { select: { name: true, slug: true, images: true } } } },
        },
      },
      address: true,
      payments: { orderBy: { id: "asc" } },
      invoices: true,
      shipment: true,
    },
  });

  if (!order) notFound();

  const customerReview = await prisma.review.findUnique({
    where: {
      orderId_reviewerId_type: {
        orderId: order.id,
        reviewerId: session.user.id,
        type: "CUSTOMER_EXPERIENCE",
      },
    },
  });

  const taxInvoice = order.invoices.find((i) => i.type === "TAX");

  const gst = gstBreakdown(order.subtotal);
  const anchor = orderDeliveryAnchor(order.status, order.shipment?.deliveredAt, order.updatedAt);

  const canReturn =
    (order.status === "DELIVERED" || order.status === "DELIVERY_CONFIRMED") &&
    anchor != null &&
    (Date.now() - anchor.getTime()) / (1000 * 60 * 60 * 24) <= 7;

  const canReview =
    (order.status === "DELIVERED" || order.status === "DELIVERY_CONFIRMED") &&
    !customerReview &&
    isWithinDaysAfterDelivery(anchor, 7);

  let reviewDeadlineLabel = "Share your experience with other verified buyers.";
  if (anchor && canReview) {
    const endMs = anchor.getTime() + 7 * 86400000;
    const daysLeft = Math.max(1, Math.ceil((endMs - Date.now()) / 86400000));
    reviewDeadlineLabel = `Reviews open for about ${daysLeft} more day(s).`;
  }

  const token = order.tokenAmount ?? 0;
  const showBalancePay =
    order.status === "TOKEN_PAID" &&
    order.balanceDueAt != null &&
    order.balanceDueAt.getTime() > Date.now();
  const balanceAmount = roundMoney(order.totalAmount - token);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <nav className="mb-6 text-sm text-muted">
        <Link href="/customer/orders" className="text-accent hover:underline">
          Orders
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">{order.orderNumber}</span>
      </nav>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-950">
        <p className="font-semibold">Order {order.orderNumber}</p>
        <p className="mt-1 text-sm">Placed on {order.createdAt.toLocaleString("en-IN")}</p>
      </div>

      {showBalancePay && order.balanceDueAt ? (
        <div className="mt-6">
          <OrderPayBalanceClient
            orderId={order.id}
            orderNumber={order.orderNumber}
            balanceDueAtIso={order.balanceDueAt.toISOString()}
            balanceAmount={balanceAmount}
            tokenAmount={token}
          />
        </div>
      ) : null}

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Status</h2>
        <div className="mt-3">
          <OrderStatusStepper status={order.status} />
        </div>
      </div>

      {canReview ? (
        <div className="mt-8">
          <CustomerOrderReviewForm orderId={order.id} deadlineLabel={reviewDeadlineLabel} />
        </div>
      ) : null}

      <div className="mt-10">
        <h2 className="font-semibold text-slate-900">Items</h2>
        <ul className="mt-3 divide-y rounded-lg border border-slate-200">
          {order.items.map((item) => {
            const raw = item.listing.product.images[0];
            const img = raw ? normalizePublicImagePath(raw) : placeholder;
            return (
              <li key={item.id} className="flex gap-3 px-3 py-3 text-sm">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <Image src={img} alt="" width={64} height={64} className="object-cover" unoptimized />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${item.listing.product.slug}`}
                    className="font-medium text-accent hover:underline"
                  >
                    {item.listing.product.name}
                  </Link>
                  <p className="text-muted">
                    Qty {item.quantity} × ₹{item.unitPrice.toLocaleString("en-IN")}
                  </p>
                </div>
                <span className="font-medium">₹{item.subtotal.toLocaleString("en-IN")}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900">Pricing</h2>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>₹{gst.subtotal.toLocaleString("en-IN")}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">CGST (9%)</dt>
            <dd>₹{gst.cgst.toLocaleString("en-IN")}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">SGST (9%)</dt>
            <dd>₹{gst.sgst.toLocaleString("en-IN")}</dd>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <dt>Grand total</dt>
            <dd>₹{order.totalAmount.toLocaleString("en-IN")}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-8">
        <h2 className="font-semibold text-slate-900">Delivery address</h2>
        <p className="mt-2 text-sm text-slate-700">
          {order.address.label}
          <br />
          {order.address.line1}
          {order.address.line2 ? `, ${order.address.line2}` : ""}
          <br />
          {order.address.city}, {order.address.state} {order.address.pincode}
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-surface p-4">
        <h2 className="font-semibold text-slate-900">Payments</h2>
        {order.payments.length > 0 ? (
          <ul className="mt-2 space-y-3 text-sm">
            {order.payments.map((p) => (
              <li key={p.id} className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                <p className="font-medium capitalize">{p.paymentPurpose.replace(/_/g, " ")}</p>
                <p className="text-muted">
                  ₹{p.amount.toLocaleString("en-IN")} · {p.status}
                </p>
                <p className="font-mono text-xs text-slate-600">{p.razorpayPaymentId ?? "—"}</p>
                {p.paidAt ? (
                  <p className="text-xs text-muted">Paid {p.paidAt.toLocaleString("en-IN")}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">Payment pending or not recorded.</p>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/customer/tracking/${order.id}`}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light"
        >
          Track order
        </Link>
        {taxInvoice ? (
          <a
            href={`/api/customer/invoices/${taxInvoice.id}/download`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-surface"
          >
            Download invoice
          </a>
        ) : (
          <span className="rounded-lg border border-dashed border-slate-200 px-4 py-2 text-sm text-muted">
            Invoice not issued yet
          </span>
        )}
        <SupportTicketModal orderId={order.id} orderNumber={order.orderNumber} />
        {canReturn ? <ReturnRequestButton orderId={order.id} /> : null}
      </div>

      <p className="mt-10 text-center text-sm">
        <Link href="/customer/orders" className="font-medium text-accent hover:underline">
          All orders
        </Link>
        {" · "}
        <Link href="/products" className="font-medium text-accent hover:underline">
          Continue shopping
        </Link>
      </p>
    </div>
  );
}
