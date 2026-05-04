"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { CommonTable, Column } from "@/components/commonStyle/CommonTable";

export type PayoutSettlementRow = {
  id: string;
  orderId: string;
  orderNumber: string;
  vendorName: string;
  grossDisplay: string;
  netDisplay: string;
  statusRaw: string;
  statusDisplay: string;
  utrDisplay: string;
};

function payoutStatusBadgeClass(status: string): string {
  const s = status.toUpperCase();
  if (s === "RELEASED") {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }
  if (s === "PROCESSING") {
    return "border-amber-100 bg-amber-50 text-amber-800";
  }
  if (s === "PENDING") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }
  return "border-amber-100 bg-amber-50 text-amber-800";
}

export default function PayoutSettlementListClient({
  title,
  subtitle,
  initialData,
}: {
  title: string;
  subtitle?: string;
  initialData: PayoutSettlementRow[];
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery) return initialData;
    const q = searchQuery.toLowerCase();
    return initialData.filter(
      (r) =>
        r.orderNumber.toLowerCase().includes(q) ||
        r.vendorName.toLowerCase().includes(q) ||
        r.grossDisplay.toLowerCase().includes(q) ||
        r.netDisplay.toLowerCase().includes(q) ||
        r.statusDisplay.toLowerCase().includes(q) ||
        r.utrDisplay.toLowerCase().includes(q),
    );
  }, [initialData, searchQuery]);

  const columns: Column<PayoutSettlementRow>[] = [
    {
      header: "Order",
      key: "orderNumber",
      width: 120,
      render: (r) => (
        <Link
          href={`/admin/orders/${r.orderId}`}
          className="font-mono text-sm font-bold text-amber-600 hover:underline"
        >
          {r.orderNumber}
        </Link>
      ),
    },
    {
      header: "Vendor",
      key: "vendorName",
      width: 180,
      cellClassName: "whitespace-normal max-w-[220px] text-[12px] text-slate-600",
    },
    {
      header: "Gross",
      key: "grossDisplay",
      width: 110,
      headerClassName: "text-right",
      cellClassName: "text-right text-xs font-bold text-slate-800",
    },
    {
      header: "Net",
      key: "netDisplay",
      width: 110,
      headerClassName: "text-right",
      cellClassName: "text-right text-xs font-black text-slate-900",
    },
    {
      header: "Status",
      key: "statusDisplay",
      width: 140,
      cellClassName: "whitespace-normal",
      render: (r) => (
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-tight ${payoutStatusBadgeClass(r.statusRaw)}`}
        >
          {r.statusDisplay}
        </span>
      ),
    },
    {
      header: "UTR",
      key: "utrDisplay",
      width: 160,
      cellClassName: "font-mono text-[11px] text-slate-600",
    },
  ];

  return (
    <CommonTable
      title=""
      subtitle=""
      actionButton={null}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Searching..."
      columns={columns}
      data={filteredData}
      keyExtractor={(r) => r.id}
    />
  );
}
