"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { CommonTable, Column, BRAND_TEXT } from "@/components/commonStyle/CommonTable";

export type LotRow = {
  id: string;
  title: string;
  vendorName: string;
  statusRaw: string;
  statusDisplay: string;
  progressDisplay: string;
};

function lotStatusBadgeClass(status: string): string {
  const s = status.toUpperCase();
  if (["LIVE", "VERIFIED", "SOLD_OUT", "DISPATCHED"].includes(s)) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }
  if (s === "CANCELLED") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }
  return "border-amber-100 bg-amber-50 text-amber-800";
}

export default function LotsListClient({ initialData }: { initialData: LotRow[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery) return initialData;
    const q = searchQuery.toLowerCase();
    return initialData.filter(
      (row) =>
        row.title.toLowerCase().includes(q) ||
        row.vendorName.toLowerCase().includes(q) ||
        row.statusDisplay.toLowerCase().includes(q) ||
        row.progressDisplay.toLowerCase().includes(q),
    );
  }, [initialData, searchQuery]);

  const columns: Column<LotRow>[] = [
    {
      header: "Title",
      key: "title",
      width: 220,
      cellClassName: "whitespace-normal max-w-[280px] text-sm font-semibold text-slate-800",
    },
    {
      header: "Vendor",
      key: "vendorName",
      width: 180,
      cellClassName: "whitespace-normal max-w-[220px] text-[12px] text-slate-600",
    },
    {
      header: "Status",
      key: "statusDisplay",
      width: 160,
      cellClassName: "whitespace-normal",
      render: (row) => (
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-tight ${lotStatusBadgeClass(row.statusRaw)}`}
        >
          {row.statusDisplay}
        </span>
      ),
    },
    {
      header: "Progress",
      key: "progressDisplay",
      width: 120,
      cellClassName: "text-xs font-bold text-slate-700",
    },
    {
      header: "Actions",
      key: "actions",
      width: 90,
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (row) => (
        <Link href={`/admin/lots/${row.id}`}>
          <button
            type="button"
            className={`rounded border border-amber-100 px-3 py-1 text-[11px] font-black transition-all ${BRAND_TEXT} hover:border-amber-600 hover:bg-amber-600 hover:text-white`}
            aria-label={`View lot ${row.title}`}
          >
            <Eye size={16} />
          </button>
        </Link>
      ),
    },
  ];

  return (
    <CommonTable
      title="Lots Sales"
      subtitle={undefined}
      actionButton={null}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Searching..."
      columns={columns}
      data={filteredData}
      keyExtractor={(row) => row.id}
      emptyMessage="No lots yet."
    />
  );
}
