import {
  CustomerOrdersTable,
  type CustomerOrderRow,
} from "@/components/customer/CustomerOrdersTable";
import { OrdersSearch } from "@/components/customer/OrdersSearch";
import { auth } from "@/lib/auth";
import { orderMatchesFilter, type OrderFilterTab } from "@/lib/customer-order-filters";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function CustomerOrdersPage({
  searchParams,
}: {
  searchParams: { tab?: string; q?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/auth/login");

  const tab = (searchParams.tab ?? "all") as OrderFilterTab;
  const q = (searchParams.q ?? "").trim().toLowerCase();

  const orders = await prisma.order.findMany({
    where: { customerId: profile.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const rows: CustomerOrderRow[] = orders
    .filter((o) => orderMatchesFilter(o.status, tab))
    .filter((o) => !q || o.orderNumber.toLowerCase().includes(q))
    .map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt.toISOString(),
      itemCount: o.items.length,
      totalAmount: o.totalAmount,
      status: o.status,
    }));

  const tabs: { id: OrderFilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "processing", label: "Processing" },
    { id: "dispatched", label: "Dispatched" },
    { id: "delivered", label: "Delivered" },
    { id: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-muted">Track and manage your purchases.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/customer/orders?tab=${t.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              tab === t.id ? "bg-accent text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <Suspense fallback={<div className="h-10 max-w-md animate-pulse rounded-lg bg-slate-100" />}>
        <OrdersSearch tab={tab} initialQ={searchParams.q ?? ""} />
      </Suspense>

      <CustomerOrdersTable data={rows} />
    </div>
  );
}
