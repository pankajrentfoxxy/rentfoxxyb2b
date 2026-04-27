import { VendorBuyerReviewForm } from "@/components/vendor/VendorBuyerReviewForm";
import { VendorOrderFulfilment } from "@/components/vendor/VendorOrderFulfilment";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function VendorOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!vendor) redirect("/auth/login");

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id,
      items: { some: { listing: { vendorId: vendor.id } } },
    },
    include: {
      address: true,
      shipment: true,
      deliveryAddresses: { include: { address: true } },
      items: {
        include: {
          listing: { include: { product: { select: { name: true, slug: true, brand: true } } } },
        },
      },
    },
  });

  if (!order) notFound();

  const vendorIds = new Set(order.items.map((i) => i.listing.vendorId));
  const multiVendor = vendorIds.size > 1;

  const myItems = order.items.filter((i) => i.listing.vendorId === vendor.id);
  const mySubtotal = myItems.reduce((s, i) => s + i.subtotal, 0);

  const canUpdate =
    !multiVendor &&
    ["ORDER_PLACED", "ORDER_CONFIRMED", "PACKED", "DISPATCHED", "OUT_FOR_DELIVERY"].includes(
      order.status,
    );

  const vendorReview = await prisma.review.findUnique({
    where: {
      orderId_reviewerId_type: {
        orderId: order.id,
        reviewerId: session.user.id,
        type: "VENDOR_CUSTOMER",
      },
    },
  });

  const canRateBuyer =
    !multiVendor &&
    ["DELIVERED", "DELIVERY_CONFIRMED", "PAYOUT_PENDING", "PAYOUT_RELEASED"].includes(order.status) &&
    !vendorReview;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/vendor/orders" className="text-sm font-medium text-accent hover:underline">
          ← Orders
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{order.orderNumber}</h1>
        <p className="mt-1 text-sm text-muted">
          Your share of this order: ₹{mySubtotal.toLocaleString("en-IN")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Ship to (redacted)</h2>
            <p className="mt-2 text-sm text-slate-700">
              {order.address.city}, {order.address.state} — {order.address.pincode}
            </p>
            <p className="mt-3 text-xs text-muted">
              Full address is hidden in the vendor portal. Use AWB on the label provided by operations if
              needed.
            </p>
          </div>

          {order.isMultiAddress && order.deliveryAddresses.length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <p className="text-[13px] font-medium text-amber-950">
                Multi-address delivery — {order.deliveryAddresses.length} locations
              </p>
              <ul className="mt-3 divide-y divide-amber-200/60 text-sm">
                {order.deliveryAddresses.map((da) => (
                  <li key={da.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div>
                      <p className="font-medium text-amber-950">{da.label ?? "Stop"}</p>
                      <p className="text-[11px] text-amber-900/80">
                        {da.address.city}, {da.address.state} · {da.quantity} units
                      </p>
                    </div>
                    <div className="text-[11px] text-amber-900">
                      {da.trackingAwb ? (
                        <span>AWB {da.trackingAwb}</span>
                      ) : (
                        <span className="text-muted">AWB pending</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <VendorOrderFulfilment
          orderId={order.id}
          orderNumber={order.orderNumber}
          status={order.status}
          canUpdate={canUpdate}
          multiVendor={multiVendor}
        />
      </div>

      {canRateBuyer ? (
        <VendorBuyerReviewForm orderId={order.id} />
      ) : null}

      {order.shipment ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Shipment</h2>
          <p className="mt-2 text-sm text-slate-700">
            {order.shipment.carrier} · AWB {order.shipment.awbNumber}
          </p>
          {order.shipment.trackingUrl ? (
            <a
              href={order.shipment.trackingUrl}
              className="mt-1 text-sm text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Tracking link
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Your line items</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {myItems.map((i) => (
            <li key={i.id} className="flex flex-wrap justify-between gap-2 py-3">
              <div>
                <p className="font-medium text-slate-900">{i.listing.product.name}</p>
                <p className="text-xs text-muted">{i.listing.product.brand} · {i.listing.sku}</p>
              </div>
              <div className="text-right text-sm">
                <p>
                  {i.quantity} × ₹{i.unitPrice.toLocaleString("en-IN")}
                </p>
                <p className="font-semibold text-slate-900">₹{i.subtotal.toLocaleString("en-IN")}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
