"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { VendorListingToggle } from "@/components/vendor/VendorListingToggle";
import { CommonTable, Column, BRAND_TEXT } from "@/components/commonStyle/CommonTable";

export type VendorProductRow = {
  id: string;
  productName: string;
  brand: string;
  sku: string;
  unitPrice: string;
  stockQty: number;
  minOrderQty: number;
  minBidPrice: string;
  isActive: boolean;
  productIsActive: boolean;
  slug: string;
};

export default function VendorProductsListClient({
  initialData,
  addListingSlot,
}: {
  initialData: VendorProductRow[];
  /** e.g. Add listing button beside search */
  addListingSlot: React.ReactNode;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery) return initialData;
    const q = searchQuery.toLowerCase();
    return initialData.filter(
      (r) =>
        r.productName.toLowerCase().includes(q) ||
        r.brand.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        r.unitPrice.includes(q),
    );
  }, [initialData, searchQuery]);

  const columns: Column<VendorProductRow>[] = [
    {
      header: "Product",
      key: "productName",
      width: 200,
      cellClassName: "whitespace-normal max-w-[220px]",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.productName}</p>
          <p className="text-[11px] text-slate-500">{row.brand}</p>
        </div>
      ),
    },
    {
      header: "SKU",
      key: "sku",
      width: 120,
      cellClassName: "font-mono text-xs text-slate-700",
    },
    {
      header: "Price (₹)",
      key: "unitPrice",
      width: 100,
      cellClassName: "text-xs font-medium text-slate-800",
    },
    {
      header: "Stock",
      key: "stockQty",
      width: 72,
      headerClassName: "text-center",
      cellClassName: "text-center text-xs font-bold text-slate-700",
    },
    {
      header: "MOQ",
      key: "minOrderQty",
      width: 72,
      headerClassName: "text-center",
      cellClassName: "text-center text-xs text-slate-700",
    },
    {
      header: "Min bid (₹)",
      key: "minBidPrice",
      width: 110,
      cellClassName: "text-xs text-slate-700",
    },
    {
      header: "Status",
      key: "status",
      width: 130,
      render: (row) =>
        row.isActive && row.productIsActive ? (
          <span className="inline-flex rounded border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-tight text-emerald-700">
            Active
          </span>
        ) : (
          <span className="inline-flex rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-tight text-slate-600">
            Hidden / inactive
          </span>
        ),
    },
    {
      header: "Storefront",
      key: "storefront",
      width: 120,
      render: (row) => (
        <Link
          href={`/products/${row.slug}`}
          className={`text-xs font-bold ${BRAND_TEXT} hover:underline`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View as buyer
        </Link>
      ),
    },
    {
      header: "Listing",
      key: "listing",
      width: 100,
      render: (row) => (
        <VendorListingToggle
          listingId={row.id}
          initialActive={row.isActive}
          productActive={row.productIsActive}
        />
      ),
    },
    {
      header: "Actions",
      key: "actions",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (row) => (
        <Link
          href={`/vendor/products/${row.id}/edit`}
          className={`text-xs font-black uppercase tracking-tight ${BRAND_TEXT} hover:underline`}
        >
          Edit
        </Link>
      ),
    },
  ];

  return (
    <CommonTable
      title="My listings"
      subtitle={undefined}
      actionButton={addListingSlot}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Searching..."
      columns={columns}
      data={filteredData}
      keyExtractor={(r) => r.id}
      emptyMessage="No listings yet"
    />
  );
}
