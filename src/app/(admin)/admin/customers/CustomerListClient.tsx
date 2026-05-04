"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { CommonTable, Column, BRAND_TEXT } from "@/components/commonStyle/CommonTable";

export type CustomerData = {
  id: string;
  name: string | null;
  email: string;
  companyName: string | null;
  orderCount: number;
  totalSpend: number;
  joinedDisplay: string;
};

export default function CustomerListClient({ initialData }: { initialData: CustomerData[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery) return initialData;
    const q = searchQuery.toLowerCase();
    return initialData.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        c.email.toLowerCase().includes(q) ||
        (c.companyName && c.companyName.toLowerCase().includes(q)),
    );
  }, [initialData, searchQuery]);

  const columns: Column<CustomerData>[] = [
    {
      header: "Name",
      key: "name",
      width: 220,
      render: (c) => (
        <span className="font-bold text-slate-800 text-sm group-hover:text-amber-700 transition-colors">
          {c.name ?? "—"}
        </span>
      ),
    },
    {
      header: "Email",
      key: "email",
      width: 260,
      cellClassName: "text-[12px] text-slate-500",
    },
    {
      header: "Company",
      key: "companyName",
      width: 220,
      render: (c) => c.companyName ?? "—",
    },
    {
      header: "Orders",
      key: "orderCount",
      headerClassName: "text-center",
      cellClassName: "text-center text-xs font-bold text-slate-700",
    },
    {
      header: "Total spend",
      key: "totalSpend",
      headerClassName: "text-right",
      cellClassName: "text-right text-xs font-black text-slate-900",
      render: (c) => `₹${c.totalSpend.toLocaleString("en-IN")}`,
    },
    {
      header: "Joined",
      key: "joinedDisplay",
      cellClassName: "text-[12px] text-slate-500",
    },
    {
      header: "Actions",
      key: "actions",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (c) => (
        <div className="flex items-center justify-center gap-1">
          <Link href={`/admin/customers/${c.id}`}>
            <button
              type="button"
              className={`rounded border border-amber-100 px-3 py-1 text-[11px] font-black transition-all ${BRAND_TEXT} hover:border-amber-600 hover:bg-amber-600 hover:text-white`}
              aria-label={`View ${c.name ?? c.email}`}
            >
              <Eye size={16} />
            </button>
          </Link>
        </div>
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
      searchPlaceholder="Search by name, email or company..."
      columns={columns}
      data={filteredData}
      keyExtractor={(c) => c.id}
    />
  );
}
