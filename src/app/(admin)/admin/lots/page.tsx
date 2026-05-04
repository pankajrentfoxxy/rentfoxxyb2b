import { prisma } from "@/lib/prisma";
import LotsListClient, { LotRow } from "./LotsListClient";

export const dynamic = "force-dynamic";

export default async function AdminLotsPage() {
  const lots = await prisma.lotListing.findMany({
    orderBy: { createdAt: "desc" },
    include: { vendor: { select: { companyName: true } } },
    take: 100,
  });

  const initialData: LotRow[] = lots.map((l) => ({
    id: l.id,
    title: l.title,
    vendorName: l.vendor.companyName,
    statusRaw: l.status,
    statusDisplay: l.status.replace(/_/g, " "),
    progressDisplay: `${l.lotsSold}/${l.totalLots} lots`,
  }));

  return (
    <div className="mx-auto max-w-7xl">
      <LotsListClient initialData={initialData} />
    </div>
  );
}
