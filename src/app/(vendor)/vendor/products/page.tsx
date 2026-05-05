import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import VendorProductsListClient, { type VendorProductRow } from "./VendorProductsListClient";

export default async function VendorProductsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!vendor) redirect("/auth/login");

  const listings = await prisma.productListing.findMany({
    where: { vendorId: vendor.id },
    orderBy: { product: { name: "asc" } },
    include: {
      product: { select: { name: true, slug: true, brand: true, isActive: true } },
    },
  });

  const initialData: VendorProductRow[] = listings.map((row: (typeof listings)[number]) => ({
    id: row.id,
    productName: row.product.name,
    brand: row.product.brand ?? "",
    sku: row.sku,
    unitPrice: row.unitPrice.toLocaleString("en-IN"),
    stockQty: row.stockQty,
    minOrderQty: row.minOrderQty,
    minBidPrice: row.minBidPrice.toLocaleString("en-IN"),
    isActive: row.isActive,
    productIsActive: row.product.isActive,
    slug: row.product.slug,
  }));

  return (
    <div className="mx-auto max-w-7xl">
      <VendorProductsListClient
        initialData={initialData}
        addListingSlot={
          <Link
            href="/vendor/products/new"
            className="inline-flex shrink-0 rounded-md border border-amber-700/30 bg-amber-600 px-4 py-1.5 text-[12px] font-black text-white shadow-sm transition-colors hover:bg-amber-700"
          >
            Add listing
          </Link>
        }
      />
      {/* <p className="mt-6 text-xs text-muted">
        Data path: PostgreSQL tables <code className="rounded bg-surface px-1">Product</code> (shared catalog) and{" "}
        <code className="rounded bg-surface px-1">ProductListing</code> (your rows, keyed by{" "}
        <code className="rounded bg-surface px-1">vendorId</code> → your{" "}
        <code className="rounded bg-surface px-1">VendorProfile</code>). Public APIs read active listings and strip
        vendor identity on the storefront.
      </p> */}
    </div>
  );
}
