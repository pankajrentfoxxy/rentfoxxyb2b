"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { CommonTable, Column, BRAND_TEXT } from "@/components/commonStyle/CommonTable";

export type CommissionVendorRow = {
  id: string;
  companyName: string;
  commissionRateDisplay: string;
};

export default function CommissionListClient({ initialData }: { initialData: CommissionVendorRow[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery) return initialData;
    const q = searchQuery.toLowerCase();
    return initialData.filter(
      (v) =>
        v.companyName.toLowerCase().includes(q) ||
        v.commissionRateDisplay.toLowerCase().includes(q),
    );
  }, [initialData, searchQuery]);

  const columns: Column<CommissionVendorRow>[] = [
    {
      header: "Vendor",
      key: "companyName",
      cellClassName: "text-sm text-slate-800",
    },
    {
      header: "Commission %",
      key: "commissionRateDisplay",
      width: 140,
      headerClassName: "text-center",
      cellClassName: "text-center text-sm font-semibold text-slate-700",
    },
    {
      header: "Actions",
      key: "actions",
      width: 140,
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (v) => (
        <Link
          href={`/admin/vendors/${v.id}`}
          className={`text-[11px] font-black uppercase tracking-tight ${BRAND_TEXT} hover:underline`}
        >
          Edit vendor
        </Link>
      ),
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
      keyExtractor={(v) => v.id}
      emptyMessage="No vendors found"
    />
  );
}
