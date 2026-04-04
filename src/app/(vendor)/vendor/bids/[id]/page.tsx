import { VendorBidTrustCard } from "@/components/vendor/VendorBidTrustCard";
import { getPaymentOptionConfig, parsePaymentOption } from "@/constants/payment-options";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function VendorBidDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!vendor) redirect("/auth/login");

  const { id } = await params;

  const bid = await prisma.bid.findFirst({
    where: { id, listing: { vendorId: vendor.id } },
    include: {
      listing: { include: { product: true } },
      customer: { select: { companyName: true, gstin: true } },
    },
  });

  if (!bid) notFound();

  const cfg = getPaymentOptionConfig(parsePaymentOption(bid.paymentOption));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/vendor/bids" className="text-sm font-medium text-accent hover:underline">
        ← Bid inbox
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">{bid.listing.product.name}</h1>
          <p className="mt-1 text-sm text-muted">{bid.listing.product.brand} · SKU {bid.listing.sku}</p>
          <p className="mt-4 text-sm">
            Buyer: <strong>{bid.customer.companyName ?? "—"}</strong>
            {bid.customer.gstin ? ` · ${bid.customer.gstin}` : ""}
          </p>
          <p className="mt-2 text-sm">
            Qty {bid.quantity} · ₹{bid.bidPricePerUnit.toLocaleString("en-IN")}/unit · Subtotal ₹
            {bid.totalBidAmount.toLocaleString("en-IN")}
          </p>
          <p className="mt-2 text-sm text-muted">
            Status: <span className="font-semibold capitalize text-slate-800">{bid.status.toLowerCase().replace(/_/g, " ")}</span>
          </p>
          <p className="mt-3 text-sm">
            Buyer payment preference: <span className="font-medium text-slate-900">{cfg.label}</span>
            {cfg.tokenPct < 100 ? (
              <span className="text-muted">
                {" "}
                — token {cfg.tokenPct}%, balance within {cfg.windowHours}h of token payment
              </span>
            ) : null}
          </p>
          <Link
            href={`/products/${bid.listing.product.slug}`}
            className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View storefront listing
          </Link>
        </div>

        <VendorBidTrustCard bidId={bid.id} />
      </div>
    </div>
  );
}
