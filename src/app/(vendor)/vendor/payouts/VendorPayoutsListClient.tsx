"use client";

import { useMemo, useState } from "react";
import { CommonTable, type Column } from "@/components/commonStyle/CommonTable";

const statusStyle: Record<string, string> = {
  PENDING: "border-amber-100 bg-amber-50 text-amber-900",
  PROCESSING: "border-sky-100 bg-sky-50 text-sky-900",
  RELEASED: "border-emerald-100 bg-emerald-50 text-emerald-800",
  FAILED: "border-rose-100 bg-rose-50 text-rose-800",
};

export type VendorPayoutRow = {
  id: string;
  createdAt: string;
  orderNumber: string;
  grossAmount: number;
  commissionAmount: number;
  commissionRate: number;
  netAmount: number;
  status: string;
  utrNumber: string | null;
};

export default function VendorPayoutsListClient({ initialData }: { initialData: VendorPayoutRow[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery) return initialData;
    const q = searchQuery.toLowerCase();
    return initialData.filter((p) => {
      const dateStr = new Date(p.createdAt).toLocaleDateString("en-IN").toLowerCase();
      return (
        p.orderNumber.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q) ||
        (p.utrNumber?.toLowerCase().includes(q) ?? false) ||
        dateStr.includes(q) ||
        p.grossAmount.toString().includes(q) ||
        p.netAmount.toString().includes(q)
      );
    });
  }, [initialData, searchQuery]);

  const columns: Column<VendorPayoutRow>[] = [
    {
      header: "Date",
      key: "createdAt",
      width: 120,
      cellClassName: "text-xs text-slate-500",
      nowrap: true,
      render: (p) => new Date(p.createdAt).toLocaleDateString("en-IN"),
    },
    {
      header: "Order",
      key: "orderNumber",
      width: 120,
      cellClassName: "font-mono text-xs font-semibold text-slate-800",
      nowrap: true,
    },
    {
      header: "Gross",
      key: "grossAmount",
      headerClassName: "text-right",
      cellClassName: "text-right text-xs text-slate-800",
      nowrap: true,
      render: (p) => `₹${p.grossAmount.toLocaleString("en-IN")}`,
    },
    {
      header: "Commission",
      key: "commissionAmount",
      headerClassName: "text-right",
      cellClassName: "whitespace-normal text-xs text-slate-700",
      render: (p) => (
        <>
          ₹{p.commissionAmount.toLocaleString("en-IN")}{" "}
          <span className="text-[11px] text-slate-500">({p.commissionRate}%)</span>
        </>
      ),
    },
    {
      header: "Net",
      key: "netAmount",
      headerClassName: "text-right",
      cellClassName: "text-right text-xs font-bold text-slate-900",
      nowrap: true,
      render: (p) => `₹${p.netAmount.toLocaleString("en-IN")}`,
    },
    {
      header: "Status",
      key: "status",
      width: 130,
      cellClassName: "whitespace-normal",
      render: (p) => (
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-tight ${
            statusStyle[p.status] ?? "border-slate-200 bg-surface text-slate-800"
          }`}
        >
          {p.status.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      header: "UTR",
      key: "utrNumber",
      width: 140,
      cellClassName: "font-mono text-xs text-slate-700",
      render: (p) => p.utrNumber ?? "—",
    },
  ];

  return (
    <CommonTable
      title="Payouts"
      subtitle={undefined}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Searching..."
      columns={columns}
      data={filteredData}
      keyExtractor={(p) => p.id}
      emptyMessage="No payouts yet"
    />
  );
}
