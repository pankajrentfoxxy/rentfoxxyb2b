import { BidProformaActions } from "@/components/customer/BidProformaActions";
import { BidCountdown } from "@/components/customer/BidCountdown";
import { BidPaymentClient } from "@/components/customer/BidPaymentClient";
import { CounterOfferActions } from "@/components/customer/CounterOfferActions";
import { getPaymentOptionConfig, parsePaymentOption } from "@/constants/payment-options";
import { auth } from "@/lib/auth";
import { normalizePublicImagePath } from "@/lib/image-url";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
export default async function CustomerBidDetailPage({
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

  const bid = await prisma.bid.findFirst({
    where: { id: params.id, customerId: profile.id },
    include: {
      listing: {
        include: { product: { select: { name: true, slug: true, images: true, description: true } } },
      },
      proformaInvoice: { select: { id: true, invoiceNumber: true } },
    },
  });
  if (!bid) notFound();

  const paidOrder = await prisma.order.findUnique({ where: { bidId: bid.id } });

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { label: "asc" }],
  });

  const rawImg = bid.listing.product.images[0];
  const img = rawImg ? normalizePublicImagePath(rawImg) : undefined;
  const now = new Date();
  const canPay =
    bid.status === "APPROVED" && (!bid.expiresAt || bid.expiresAt > now) && !paidOrder;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <nav className="text-sm text-muted">
        <Link href="/customer/bids" className="text-accent hover:underline">
          Bids
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Request</span>
      </nav>

      <div className="flex gap-4">
        {img ? (
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
            <Image src={img} alt="" width={96} height={96} className="object-cover" />
          </div>
        ) : null}
        <div>
          <h1 className="text-xl font-bold text-slate-900">{bid.listing.product.name}</h1>
          <Link href={`/products/${bid.listing.product.slug}`} className="text-sm text-accent hover:underline">
            View product
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Your bid</h2>
        <p className="mt-2 text-sm">
          ₹{bid.bidPricePerUnit.toLocaleString("en-IN")} × {bid.quantity} units ={" "}
          <strong>₹{bid.totalBidAmount.toLocaleString("en-IN")}</strong> (excl. GST — GST added at payment)
        </p>
        <p className="mt-2 text-sm text-muted">
          Status: <span className="font-medium capitalize">{bid.status.toLowerCase().replace(/_/g, " ")}</span>
        </p>
        <p className="mt-2 text-xs text-slate-600">
          Payment preference if approved:{" "}
          <span className="font-medium">
            {getPaymentOptionConfig(parsePaymentOption(bid.paymentOption)).label}
          </span>
        </p>

        {bid.status === "PENDING" ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            Under review by supplier
          </div>
        ) : null}

        {bid.status === "APPROVED" && bid.expiresAt && bid.expiresAt > now ? (
          <p className="mt-4 text-sm text-amber-900">
            Complete payment within <BidCountdown expiresAt={bid.expiresAt.toISOString()} />
          </p>
        ) : null}

        {bid.status === "APPROVED" ? (
          <BidProformaActions
            bidId={bid.id}
            invoiceId={bid.proformaInvoice?.id ?? null}
            invoiceNumber={bid.proformaInvoice?.invoiceNumber}
          />
        ) : null}

        {bid.status === "COUNTER_OFFERED" && bid.counterPrice != null ? (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-slate-900">Counter offer</p>
            <p className="mt-1 text-sm">
              New price: <strong>₹{bid.counterPrice.toLocaleString("en-IN")}</strong> per unit (
              {bid.quantity} units → ₹
              {(Math.round(bid.quantity * bid.counterPrice * 100) / 100).toLocaleString("en-IN")} subtotal)
            </p>
            <CounterOfferActions bidId={bid.id} />
          </div>
        ) : null}

        {bid.status === "REJECTED" ? (
          <p className="mt-4 text-sm text-muted">
            Unable to accommodate at this price. You may submit a new bid from the product page.
          </p>
        ) : null}

        {paidOrder ? (
          <p className="mt-4">
            <Link
              href={`/customer/orders/${paidOrder.id}`}
              className="font-medium text-accent hover:underline"
            >
              View order {paidOrder.orderNumber}
            </Link>
          </p>
        ) : null}

        {canPay && addresses.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900">Checkout</h3>
            <div className="mt-3">
              <BidPaymentClient
                bidId={bid.id}
                grossTotal={bid.totalBidAmount}
                addresses={addresses}
                paymentOption={bid.paymentOption}
              />
            </div>
          </div>
        ) : canPay && addresses.length === 0 ? (
          <p className="mt-4 text-sm text-orange-800">
            Add a delivery address under Profile before paying.
          </p>
        ) : null}
      </div>

      <div className="text-xs text-muted">
        <p>
          Timeline: Submitted → Under review → Decision. Supplier identity is never shown on the storefront
          (Rentfoxxy policy).
        </p>
      </div>
    </div>
  );
}
