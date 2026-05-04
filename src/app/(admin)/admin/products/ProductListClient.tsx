"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Edit } from "lucide-react";
import { CommonTable, Column, BRAND_TEXT } from "@/components/commonStyle/CommonTable";

export type ProductData = {
  id: string;
  imageUrl: string | null;
  name: string;
  categoryName: string;
  brand: string;
  conditionLive: string;
  pendingCCount: number;
  vendorCount: number;
  priceRangeDisplay: string;
  isActive: boolean;
  isFeatured: boolean;
};

export default function ProductListClient({
  initialData,
  pendingGradeCOnly,
}: {
  initialData: ProductData[];
  pendingGradeCOnly: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery) return initialData;
    const q = searchQuery.toLowerCase();
    return initialData.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.conditionLive.toLowerCase().includes(q),
    );
  }, [initialData, searchQuery]);

  const columns: Column<ProductData>[] = [
    {
      header: "Image",
      key: "imageUrl",
      width: 72,
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (p) =>
        p.imageUrl ? (
          <Image
            src={p.imageUrl}
            alt=""
            width={40}
            height={40}
            className="mx-auto h-10 w-10 rounded object-cover"
          />
        ) : (
          <div className="mx-auto h-10 w-10 rounded bg-slate-100" />
        ),
    },
    {
      header: "Name",
      key: "name",
      width: 200,
      render: (p) => (
        <span className="font-bold text-slate-800 text-sm group-hover:text-amber-700 transition-colors">
          {p.name}
        </span>
      ),
    },
    {
      header: "Category",
      key: "categoryName",
      width: 140,
      cellClassName: "text-[12px] text-slate-600",
    },
    {
      header: "Brand",
      key: "brand",
      width: 120,
      cellClassName: "text-[12px] text-slate-700 font-medium",
    },
    {
      header: "Condition (live)",
      key: "conditionLive",
      width: 200,
      cellClassName: "whitespace-normal max-w-[220px] text-xs text-slate-700",
      render: (p) => (
        <span>
          <span>{p.conditionLive}</span>
          {p.pendingCCount > 0 ? (
            <span className="ml-1 inline-block rounded border border-amber-100 bg-amber-50 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-tight text-amber-800">
              {p.pendingCCount} C pending
            </span>
          ) : null}
        </span>
      ),
    },
    {
      header: "Vendors",
      key: "vendorCount",
      headerClassName: "text-center",
      cellClassName: "text-center text-xs font-bold text-slate-700",
    },
    {
      header: "Price range (₹)",
      width: 150,
      key: "priceRangeDisplay",
      headerClassName: "text-right",
      cellClassName: "text-right text-xs font-black text-slate-900",
    },
    {
      header: "Status",
      key: "status",
      width: 160,
      cellClassName: "whitespace-normal",
      render: (p) => (
        <div className="flex flex-wrap gap-1">
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-tight ${
              p.isActive
                ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border border-slate-200 bg-slate-100 text-slate-600"
            }`}
          >
            {p.isActive ? "Active" : "Inactive"}
          </span>
          {p.isFeatured ? (
            <span className="inline-flex items-center rounded border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-tight text-amber-800">
              Featured
            </span>
          ) : null}
        </div>
      ),
    },
    {
      header: "Actions",
      key: "actions",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (p) => (
        <Link href={`/admin/products/${p.id}`}>
          <button
            type="button"
            className={`rounded border border-amber-100 px-3 py-1 text-[11px] font-black transition-all ${BRAND_TEXT} hover:border-amber-600 hover:bg-amber-600 hover:text-white`}
            aria-label={`Edit ${p.name}`}
          >
            <Edit size={16} />
          </button>
        </Link>
      ),
    },
  ];

  const tabs = [
    { label: "All products", href: "/admin/products", active: !pendingGradeCOnly },
    {
      label: "Grade C pending only",
      href: "/admin/products?pendingGradeC=1",
      active: pendingGradeCOnly,
    },
  ];

  return (
    <CommonTable
      actionButton={null}
      tabs={tabs}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search by name, category, brand or condition..."
      columns={columns}
      data={filteredData}
      keyExtractor={(p) => p.id}
    />
  );
}
