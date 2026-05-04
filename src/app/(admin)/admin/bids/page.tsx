import { prisma } from "@/lib/prisma";
import BidListClient, { BidData } from "./BidListClient";

export default async function AdminBidsPage() {
  const bids = await prisma.bid.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      customer: { include: { user: { select: { email: true, name: true } } } },
      listing: { include: { product: { select: { name: true } }, vendor: true } },
    },
  });

  const initialData: BidData[] = bids.map((b) => ({
    id: b.id,
    customerLine: b.customer.user.name ?? b.customer.user.email,
    companyLine: b.customer.companyName ?? "",
    productName: b.listing.product.name,
    vendorId: b.listing.vendorId,
    vendorName: b.listing.vendor.companyName,
    quantity: b.quantity,
    bidPriceDisplay: `₹${b.bidPricePerUnit.toLocaleString("en-IN")}`,
    statusRaw: b.status,
    statusDisplay: b.status.replace(/_/g, " "),
    createdDisplay: b.createdAt.toLocaleString("en-IN"),
    expiresDisplay: b.expiresAt ? b.expiresAt.toLocaleString("en-IN") : "—",
  }));

  return (
    <div className="mx-auto max-w-7xl">
      <BidListClient initialData={initialData} />
    </div>
  );
}
