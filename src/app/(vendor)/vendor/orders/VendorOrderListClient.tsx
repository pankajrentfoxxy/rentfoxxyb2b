"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { CommonTable, Column, BRAND_TEXT } from "@/components/commonStyle/CommonTable";

export type VendorOrderRow = {
  id: string;
  orderNumber: string;
  linesLabel: string;
  totalDisplay: string;
  statusRaw: string;
  statusDisplay: string;
  dateDisplay: string;
};

function orderStatusBadgeClass(status: string): string {
  const s = status.toUpperCase();
  if (["DELIVERED", "DELIVERY_CONFIRMED", "PAYOUT_RELEASED"].includes(s)) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }
  if (["CANCELLED", "REFUNDED", "TOKEN_FORFEITED"].includes(s)) {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }
  return "border-amber-100 bg-amber-50 text-amber-800";
}

export default function VendorOrderListClient({ initialData }: { initialData: VendorOrderRow[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery) return initialData;
    const q = searchQuery.toLowerCase();
    return initialData.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.linesLabel.toLowerCase().includes(q) ||
        o.statusDisplay.toLowerCase().includes(q) ||
        o.dateDisplay.toLowerCase().includes(q) ||
        o.totalDisplay.toLowerCase().includes(q),
    );
  }, [initialData, searchQuery]);

  const columns: Column<VendorOrderRow>[] = [
    {
      header: "Order#",
      key: "orderNumber",
      width: 120,
      render: (o) => (
        <div>
          <Link
            href={`/vendor/orders/${o.id}`}
            className="font-mono text-sm font-bold text-amber-600 hover:underline"
          >
            {o.orderNumber}
          </Link>
          <p className="mt-0.5 text-[11px] text-slate-500">{o.dateDisplay}</p>
        </div>
      ),
    },
    {
      header: "Your lines",
      key: "linesLabel",
      width: 280,
      cellClassName: "whitespace-normal max-w-[320px] text-xs text-slate-700",
    },
    {
      header: "Your total",
      key: "totalDisplay",
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
      header: "Actions",
      key: "actions",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (o) => (
        <Link href={`/vendor/orders/${o.id}`}>
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
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Searching..."
      columns={columns}
      data={filteredData}
      keyExtractor={(o) => o.id}
      emptyMessage="No orders yet"
    />
  );
}
