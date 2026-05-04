import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import VendorListClient, { VendorData } from "./VendorListClient";

export const dynamic = "force-dynamic";

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: { tab?: string; lowScore?: string };
}) {
  const pendingOnly = searchParams.tab === "pending";
  const lowScore = searchParams.lowScore === "1";

  const and: Prisma.VendorProfileWhereInput[] = [];
  if (pendingOnly) and.push({ status: "PENDING_APPROVAL" });
  if (lowScore) {
    and.push({
      OR: [
        { vendorScore: { is: null } },
        { vendorScore: { overallScore: { lt: 60 } } },
      ],
    });
  }
  const where: Prisma.VendorProfileWhereInput = and.length ? { AND: and } : {};

  const vendors = await prisma.vendorProfile.findMany({
    where,
    orderBy: { companyName: "asc" },
    include: {
      user: { select: { email: true } },
      listings: { select: { id: true } },
      vendorScore: { select: { overallScore: true } },
    },
  });

  const stats = await Promise.all(
    vendors.map(async (v) => {
      const revenue = await prisma.orderItem.aggregate({
        where: { listing: { vendorId: v.id } },
        _sum: { subtotal: true },
      });
      const orderCount = await prisma.order.count({
        where: { items: { some: { listing: { vendorId: v.id } } } },
      });
      return { vendorId: v.id, revenue: revenue._sum.subtotal ?? 0, orderCount };
    }),
  );
  const map = new Map(stats.map((s) => [s.vendorId, s]));

  const initialData: VendorData[] = vendors.map(v => {
    const s = map.get(v.id)!;
    return {
      id: v.id,
      companyName: v.companyName,
      gstin: v.gstin || 'N/A',
      email: v.user.email,
      status: v.status,
      score: v.vendorScore?.overallScore ?? null,
      commission: `${v.commissionRate}%`,
      orders: s.orderCount,
      revenue: Number(s.revenue),
    };
  });

  return (
    <VendorListClient 
      initialData={initialData} 
      pendingOnly={pendingOnly} 
      lowScore={lowScore} 
    />
  );
}
