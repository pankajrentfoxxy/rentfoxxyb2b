"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { CommonTable, Column, BRAND_TEXT } from "@/components/commonStyle/CommonTable";

export type OrderData = {
  id: string;
  orderNumber: string;
  bidOrder: boolean;
  customerLine: string;
  companyLine: string;
  vendorsLabel: string;
  itemCount: number;
  amountDisplay: string;
  statusRaw: string;
  statusDisplay: string;
  dateDisplay: string;
};

function orderStatusBadgeClass(status: string): string {
  const s = status.toUpperCase();
  if (
    ["DELIVERED", "DELIVERY_CONFIRMED", "PAYOUT_RELEASED"].includes(s)
  ) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }
  if (["CANCELLED", "REFUNDED", "TOKEN_FORFEITED"].includes(s)) {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }
  return "border-amber-100 bg-amber-50 text-amber-800";
}

export default function OrderListClient({
  initialData,
  filterSlot,
}: {
  initialData: OrderData[];
  /** e.g. filter drawer trigger beside the title */
  filterSlot?: React.ReactNode;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery) return initialData;
    const q = searchQuery.toLowerCase();
    return initialData.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerLine.toLowerCase().includes(q) ||
        o.companyLine.toLowerCase().includes(q) ||
        o.vendorsLabel.toLowerCase().includes(q) ||
        o.statusDisplay.toLowerCase().includes(q) ||
        o.dateDisplay.toLowerCase().includes(q),
    );
  }, [initialData, searchQuery]);

  const columns: Column<OrderData>[] = [
    {
      header: "Order#",
      key: "orderNumber",
      width: 100,
      render: (o) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={`/admin/orders/${o.id}`}
            className="font-mono text-sm font-bold text-amber-600 hover:underline"
          >
            {o.orderNumber}
          </Link>
          {o.bidOrder ? (
            <span className="inline-flex rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-tight text-amber-800">
              BID
            </span>
          ) : null}
        </div>
      ),
    },
    {
      header: "Customer",
      key: "customerLine",
      width: 150,
      cellClassName: "whitespace-normal max-w-[220px]",
      render: (o) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800">{o.customerLine}</div>
          {o.companyLine ? (
            <div className="mt-0.5 text-[11px] text-slate-500">{o.companyLine}</div>
          ) : null}
        </div>
      ),
    },
    {
      header: "Vendor(s)",
      key: "vendorsLabel",
      width: 200,
      cellClassName: "whitespace-normal max-w-[220px] text-[12px] text-slate-600",
    },
    {
      header: "Items",
      key: "itemCount",
      headerClassName: "text-center",
      cellClassName: "text-center text-xs font-bold text-slate-700",
    },
    {
      header: "Amount",
      key: "amountDisplay",
      headerClassName: "text-right",
      cellClassName: "text-right text-xs font-black text-slate-900",
    },
    {
      header: "Status",
      key: "statusDisplay",
      width: 160,
      cellClassName: "whitespace-normal",
      render: (o) => (
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-tight ${orderStatusBadgeClass(o.statusRaw)}`}
        >
          {o.statusDisplay}
        </span>
      ),
    },
    {
      header: "Date",
      key: "dateDisplay",
      width: 140,
      cellClassName: "text-[11px] text-slate-500",
    },
    {
      header: "Actions",
      key: "actions",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (o) => (
        <Link href={`/admin/orders/${o.id}`}>
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
      subtitle="Cross-vendor visibility for ops and support."
      actionButton={filterSlot ?? null}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Searching..."
      columns={columns}
      data={filteredData}
      keyExtractor={(o) => o.id}
    />
  );
}
