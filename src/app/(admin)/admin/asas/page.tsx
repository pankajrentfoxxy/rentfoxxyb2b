import { prisma } from "@/lib/prisma";
import AsAsListClient, { AsAsRow } from "./AsAsListClient";

export const dynamic = "force-dynamic";

export default async function AdminAsAsPage() {
  const listings = await prisma.asAsListing.findMany({
    orderBy: { createdAt: "desc" },
    include: { vendor: { select: { companyName: true } } },
    take: 100,
  });

  const initialData: AsAsRow[] = listings.map((l) => ({
    id: l.id,
    title: l.title,
    vendorName: l.vendor.companyName,
    statusRaw: l.status,
    statusDisplay: l.status.replace(/_/g, " "),
    unitsDisplay: `${l.unitsSold}/${l.totalUnits}`,
  }));

  return (
    <div className="mx-auto max-w-7xl">
      <AsAsListClient initialData={initialData} />
    </div>
  );
}
