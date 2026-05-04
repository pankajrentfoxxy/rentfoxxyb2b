"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { CommonTable, Column, BRAND_TEXT } from "@/components/commonStyle/CommonTable";

export type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  orderId: string | null;
  orderNumber: string | null;
  hasBidProforma: boolean;
  typeRaw: string;
  typeDisplay: string;
  issuedDisplay: string;
};

function invoiceTypeBadgeClass(type: string): string {
  const t = type.toUpperCase();
  if (t === "TAX") {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }
  if (t === "PROFORMA") {
    return "border-amber-100 bg-amber-50 text-amber-800";
  }
  if (t === "CREDIT_NOTE") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }
  return "border-slate-200 bg-slate-100 text-slate-600";
}

export default function InvoiceListClient({ initialData }: { initialData: InvoiceRow[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery) return initialData;
    const q = searchQuery.toLowerCase();
    return initialData.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.orderNumber?.toLowerCase().includes(q) ?? false) ||
        inv.typeDisplay.toLowerCase().includes(q) ||
        inv.issuedDisplay.toLowerCase().includes(q) ||
        (inv.hasBidProforma && "proforma (bid)".toLowerCase().includes(q)),
    );
  }, [initialData, searchQuery]);

  const columns: Column<InvoiceRow>[] = [
    {
      header: "Invoice#",
      key: "invoiceNumber",
      width: 140,
      cellClassName: "font-mono text-xs text-slate-800",
    },
    {
      header: "Order",
      key: "orderNumber",
      width: 140,
      render: (inv) =>
        inv.orderId && inv.orderNumber ? (
          <Link
            href={`/admin/orders/${inv.orderId}`}
            className={`text-sm font-semibold ${BRAND_TEXT} hover:underline`}
          >
            {inv.orderNumber}
          </Link>
        ) : inv.hasBidProforma ? (
          <Link href="/admin/bids" className="text-sm text-slate-500 hover:underline">
            Proforma (bid)
          </Link>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      header: "Type",
      key: "typeDisplay",
      width: 120,
      cellClassName: "whitespace-normal",
      render: (inv) => (
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-tight ${invoiceTypeBadgeClass(inv.typeRaw)}`}
        >
          {inv.typeDisplay}
        </span>
      ),
    },
    {
      header: "Issued",
      key: "issuedDisplay",
      width: 170,
      cellClassName: "text-[11px] text-slate-500",
    },
    {
      header: "File",
      key: "file",
      width: 90,
      render: (inv) => (
        <a
          href={`/api/admin/invoices/${inv.id}/download`}
          className={`inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-tight ${BRAND_TEXT} hover:underline`}
          target="_blank"
          rel="noreferrer"
        >
          <FileText size={14} />
          PDF
        </a>
      ),
    },
  ];

  return (
    <CommonTable
      title="Invoices"
      subtitle={undefined}
      actionButton={null}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Searching..."
      columns={columns}
      data={filteredData}
      keyExtractor={(inv) => inv.id}
      emptyMessage="No matching invoices found"
    />
  );
}
