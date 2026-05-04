"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AdminBidRowActions } from "@/components/admin/AdminBidRowActions";
import { CommonTable, Column, BRAND_TEXT } from "@/components/commonStyle/CommonTable";

export type BidData = {
  id: string;
  customerLine: string;
  companyLine: string;
  productName: string;
  vendorId: string;
  vendorName: string;
  quantity: number;
  bidPriceDisplay: string;
  statusRaw: string;
  statusDisplay: string;
  createdDisplay: string;
  expiresDisplay: string;
};

function bidStatusBadgeClass(status: string): string {
  const s = status.toUpperCase();
  if (["APPROVED", "PAID"].includes(s)) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }
  if (["REJECTED", "EXPIRED", "CANCELLED"].includes(s)) {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }
  return "border-amber-100 bg-amber-50 text-amber-800";
}

export default function BidListClient({ initialData }: { initialData: BidData[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery) return initialData;
    const q = searchQuery.toLowerCase();
    return initialData.filter(
      (b) =>
        b.customerLine.toLowerCase().includes(q) ||
        b.companyLine.toLowerCase().includes(q) ||
        b.productName.toLowerCase().includes(q) ||
        b.vendorName.toLowerCase().includes(q) ||
        b.statusDisplay.toLowerCase().includes(q) ||
        b.createdDisplay.toLowerCase().includes(q) ||
        b.expiresDisplay.toLowerCase().includes(q) ||
        b.bidPriceDisplay.toLowerCase().includes(q),
    );
  }, [initialData, searchQuery]);

  const columns: Column<BidData>[] = [
    {
      header: "Customer",
      key: "customerLine",
      width: 180,
      cellClassName: "whitespace-normal max-w-[220px]",
      render: (b) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800">{b.customerLine}</div>
          {b.companyLine ? (
            <div className="mt-0.5 text-[11px] text-slate-500">{b.companyLine}</div>
          ) : null}
        </div>
      ),
    },
    {
      header: "Product",
      key: "productName",
      width: 200,
      cellClassName: "whitespace-normal max-w-[240px] text-[12px] text-slate-700",
    },
    {
      header: "Vendor",
      key: "vendorName",
      width: 160,
      cellClassName: "whitespace-normal max-w-[200px]",
      render: (b) => (
        <Link
          href={`/admin/vendors/${b.vendorId}`}
          className={`text-[12px] font-semibold ${BRAND_TEXT} hover:underline`}
        >
          {b.vendorName}
        </Link>
      ),
    },
    {
      header: "Qty",
      key: "quantity",
      width: 64,
      headerClassName: "text-center",
      cellClassName: "text-center text-xs font-bold text-slate-700",
    },
    {
      header: "Bid ₹",
      key: "bidPriceDisplay",
      width: 100,
      headerClassName: "text-right",
      cellClassName: "text-right text-xs font-black text-slate-900",
    },
    {
      header: "Status",
      key: "statusDisplay",
      width: 140,
      cellClassName: "whitespace-normal",
      render: (b) => (
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-tight ${bidStatusBadgeClass(b.statusRaw)}`}
        >
          {b.statusDisplay}
        </span>
      ),
    },
    {
      header: "Created",
      key: "createdDisplay",
      width: 160,
      cellClassName: "whitespace-normal text-[11px] text-slate-500",
    },
    {
      header: "Expires",
      key: "expiresDisplay",
      width: 160,
      cellClassName: "whitespace-normal text-[11px] text-slate-500",
    },
    {
      header: "Actions",
      key: "actions",
      headerClassName: "text-center",
      cellClassName: "text-center whitespace-normal",
      render: (b) => <AdminBidRowActions bidId={b.id} />,
    },
  ];

  return (
    <CommonTable
      title="Bids"
      subtitle=""
      actionButton={null}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Searching..."
      columns={columns}
      data={filteredData}
      keyExtractor={(b) => b.id}
    />
  );
}
