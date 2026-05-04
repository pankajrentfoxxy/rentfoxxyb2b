import { AdminPayoutRelease } from "@/components/admin/AdminPayoutRelease";
import { FilterTabChip } from "@/components/commonStyle/FilterTabChip";
import { prisma } from "@/lib/prisma";
import CommissionListClient, { CommissionVendorRow } from "./CommissionListClient";
import PayoutSettlementListClient, { PayoutSettlementRow } from "./PayoutSettlementListClient";

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const tab = searchParams.tab ?? "pending";

  const eligibleOrderStatuses = ["DELIVERY_CONFIRMED", "DELIVERED", "PAYOUT_PENDING"] as const;

  const [pending, processing, released, vendors] = await Promise.all([
    prisma.payout.findMany({
      where: {
        status: "PENDING",
        order: { status: { in: [...eligibleOrderStatuses] } },
      },
      orderBy: { createdAt: "desc" },
      include: { vendor: true, order: { include: { shipment: true } } },
    }),
    prisma.payout.findMany({
      where: { status: "PROCESSING" },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { vendor: true, order: true },
    }),
    prisma.payout.findMany({
      where: { status: "RELEASED" },
      orderBy: { releasedAt: "desc" },
      take: 100,
      include: { vendor: true, order: true },
    }),
    prisma.vendorProfile.findMany({
      orderBy: { companyName: "asc" },
      select: { id: true, companyName: true, commissionRate: true },
    }),
  ]);

  const pendingRows = pending.map((p) => ({
    id: p.id,
    orderNumber: p.order.orderNumber,
    vendorName: p.vendor.companyName,
    grossAmount: p.grossAmount,
    commissionRate: p.commissionRate,
    netAmount: p.netAmount,
    deliveredAt: p.order.shipment?.deliveredAt?.toISOString() ?? null,
  }));

  function toSettlementRows(
    payouts: typeof processing,
  ): PayoutSettlementRow[] {
    return payouts.map((p) => ({
      id: p.id,
      orderId: p.order.id,
      orderNumber: p.order.orderNumber,
      vendorName: p.vendor.companyName,
      grossDisplay: `₹${p.grossAmount.toLocaleString("en-IN")}`,
      netDisplay: `₹${p.netAmount.toLocaleString("en-IN")}`,
      statusRaw: p.status,
      statusDisplay: p.status.replace(/_/g, " "),
      utrDisplay: p.utrNumber ?? "—",
    }));
  }

  const commissionRows: CommissionVendorRow[] = vendors.map((v) => ({
    id: v.id,
    companyName: v.companyName,
    commissionRateDisplay: `${v.commissionRate}%`,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {(
          [
            ["pending", "Pending release"],
            ["processing", "Processing"],
            ["released", "Released"],
            ["commission", "Commission"],
          ] as const
        ).map(([id, label]) => (
          <FilterTabChip
            key={id}
            // variant="primary"
            active={tab === id}
            href={`/admin/payouts?tab=${id}`}
          >
            {label}
          </FilterTabChip>
        ))}
      </div>

      {tab === "pending" ? (
        pending.length === 0 ? (
          <p className="text-sm text-muted">No pending payouts eligible for release.</p>
        ) : (
          <AdminPayoutRelease pendingRows={pendingRows} />
        )
      ) : null}

      {tab === "processing" ? (
        <PayoutSettlementListClient
          title="Processing"
          subtitle="Payouts in flight with your payment provider."
          initialData={toSettlementRows(processing)}
        />
      ) : null}
      {tab === "released" ? (
        <PayoutSettlementListClient
          title="Released"
          subtitle="Recently completed vendor settlements."
          initialData={toSettlementRows(released)}
        />
      ) : null}

      {tab === "commission" ? <CommissionListClient initialData={commissionRows} /> : null}
    </div>
  );
}
