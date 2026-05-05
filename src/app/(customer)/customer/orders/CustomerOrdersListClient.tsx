"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { CommonTable, type Column, type TabItem, BRAND_TEXT } from "@/components/commonStyle/CommonTable";
import { getStatusBadge, statusBadgeLabel } from "@/lib/status-badge";
import type { OrderFilterTab } from "@/lib/customer-order-filters";
import type { OrderStatus } from "@prisma/client";

export type CustomerOrderRow = {
  id: string;
  orderNumber: string;
  createdAt: string;
  itemCount: number;
  totalAmount: number;
  status: OrderStatus;
};

const TAB_DEFS: { id: OrderFilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "processing", label: "Processing" },
  { id: "dispatched", label: "Dispatched" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

export default function CustomerOrdersListClient({
  initialData,
  tab,
}: {
  initialData: CustomerOrderRow[];
  tab: OrderFilterTab;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return initialData;
    const q = searchQuery.toLowerCase().trim();
    return initialData.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        statusBadgeLabel(o.status).toLowerCase().includes(q),
    );
  }, [initialData, searchQuery]);

  const tabs: TabItem[] = TAB_DEFS.map((t) => ({
    label: t.label,
    active: tab === t.id,
    href: `/customer/orders?tab=${t.id}`,
  }));

  const columns: Column<CustomerOrderRow>[] = [
    {
      header: "Order#",
      key: "orderNumber",
      width: 120,
      nowrap: true,
      render: (o) => (
        <Link
          href={`/customer/orders/${o.id}`}
          className="font-mono text-sm font-bold text-amber-600 hover:underline"
        >
          {o.orderNumber}
        </Link>
      ),
    },
    {
      header: "Date",
      key: "createdAt",
      width: 120,
      nowrap: true,
      cellClassName: "text-xs text-slate-600",
      render: (o) => new Date(o.createdAt).toLocaleDateString("en-IN"),
    },
    {
      header: "Items",
      key: "itemCount",
      headerClassName: "text-center",
      cellClassName: "text-center text-xs font-bold text-slate-700",
      nowrap: true,
    },
    {
      header: "Amount",
      key: "totalAmount",
      headerClassName: "text-right",
      cellClassName: "text-right text-xs font-black text-slate-900",
      nowrap: true,
      render: (o) => `₹${o.totalAmount.toLocaleString("en-IN")}`,
    },
    {
      header: "Status",
      key: "status",
      width: 160,
      cellClassName: "whitespace-normal",
      render: (o) => (
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-tight ${getStatusBadge(o.status)}`}
        >
          {statusBadgeLabel(o.status)}
        </span>
      ),
    },
    {
      header: "Actions",
      key: "actions",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (o) => (
        <Link href={`/customer/orders/${o.id}`}>
          <button
            type="button"
            className={`rounded border border-amber-100 px-3 py-1 text-[11px] font-black transition-all ${BRAND_TEXT} hover:border-amber-600 hover:bg-amber-600 hover:text-white`}
            aria-label={`View order ${o.orderNumber}`}
          >
            <Eye size={16} />
          </button>
        </Link>
      ),
    },
  ];

  return (
    <CommonTable
      title="Orders"
      subtitle={undefined}
      tabs={tabs}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Searching..."
      columns={columns}
      data={filteredData}
      keyExtractor={(o) => o.id}
      emptyMessage="No orders in this view"
    />
  );
}
