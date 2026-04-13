import { VendorListingEditor } from "@/components/vendor/VendorListingEditor";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

export default async function EditVendorListingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!vendor) redirect("/auth/login");

  const { id } = await params;
  const row = await prisma.productListing.findFirst({
    where: { id, vendorId: vendor.id },
    include: {
      product: { select: { name: true, slug: true, brand: true } },
    },
  });
  if (!row) notFound();

  const initial = {
    product: row.product,
    sku: row.sku,
    unitPrice: row.unitPrice,
    minBidPrice: row.minBidPrice,
    stockQty: row.stockQty,
    minOrderQty: row.minOrderQty,
    bulkPricing: row.bulkPricing,
    condition: row.condition,
    conditionNotes: row.conditionNotes,
    refurbImages: row.refurbImages,
    requiresAdminApproval: row.requiresAdminApproval,
    isActive: row.isActive,
  };

  return (
    <div className="mx-auto max-w-xl py-4 md:py-8">
      <VendorListingEditor mode="edit" listingId={row.id} initial={initial} />
    </div>
  );
}
