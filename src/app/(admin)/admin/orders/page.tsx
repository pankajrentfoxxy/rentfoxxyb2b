import { AdminOrdersFilterDrawer } from "@/components/admin/AdminOrdersFilterDrawer";
import { prisma } from "@/lib/prisma";
import type { OrderStatus, Prisma } from "@prisma/client";
import OrderListClient, { OrderData } from "./OrderListClient";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    vendorId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: string;
    maxAmount?: string;
    bidOnly?: string;
  }>;
}) {
  const sp = await searchParams;
  const vendorId = sp.vendorId ?? "";
  const status = sp.status as OrderStatus | undefined;
  const dateFrom = sp.dateFrom ?? "";
  const dateTo = sp.dateTo ?? "";
  const minAmount = sp.minAmount ?? "";
  const maxAmount = sp.maxAmount ?? "";
  const bidOnly = sp.bidOnly === "1";

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status;
  const created: Prisma.DateTimeFilter = {};
  if (dateFrom) created.gte = new Date(dateFrom);
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    created.lte = end;
  }
  if (Object.keys(created).length) where.createdAt = created;
  const amt: Prisma.FloatFilter = {};
  if (minAmount && Number.isFinite(Number(minAmount))) amt.gte = Number(minAmount);
  if (maxAmount && Number.isFinite(Number(maxAmount))) amt.lte = Number(maxAmount);
  if (Object.keys(amt).length) where.totalAmount = amt;
  if (bidOnly) where.bidId = { not: null };
  if (vendorId) where.items = { some: { listing: { vendorId } } };

  const [orders, vendors] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        customer: { include: { user: { select: { email: true, name: true } } } },
        items: { include: { listing: { include: { vendor: true, product: true } } } },
      },
    }),
    prisma.vendorProfile.findMany({ orderBy: { companyName: "asc" }, select: { id: true, companyName: true } }),
  ]);

  const initialData: OrderData[] = orders.map((o) => {
    const vendorNames = Array.from(new Set(o.items.map((i) => i.listing.vendor.companyName)));
    const vendorsLabel =
      vendorNames.length > 2 ? `${vendorNames.length} vendors` : vendorNames.join(", ");
    const customerLine = o.customer.user.name ?? o.customer.user.email;
    const companyLine = o.customer.companyName ?? "";

    return {
      id: o.id,
      orderNumber: o.orderNumber,
      bidOrder: o.bidId != null,
      customerLine,
      companyLine,
      vendorsLabel,
      itemCount: o.items.length,
      amountDisplay: `₹${o.totalAmount.toLocaleString("en-IN")}`,
      statusRaw: o.status,
      statusDisplay: o.status.replace(/_/g, " "),
      dateDisplay: o.createdAt.toLocaleString("en-IN"),
    };
  });

  return (
    <div className="mx-auto max-w-7xl">
      <OrderListClient
        initialData={initialData}
        filterSlot={
          <AdminOrdersFilterDrawer
            vendors={vendors}
            initial={{ vendorId, status: status ?? "", dateFrom, dateTo, minAmount, maxAmount, bidOnly }}
          />
        }
      />
    </div>
  );
}
