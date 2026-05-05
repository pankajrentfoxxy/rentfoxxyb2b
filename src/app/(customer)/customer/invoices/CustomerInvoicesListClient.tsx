"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CommonTable, type Column, BRAND_TEXT } from "@/components/commonStyle/CommonTable";
import { Download } from "lucide-react";

export type CustomerInvoiceRow = {
  id: string;
  invoiceNumber: string;
  orderId: string | null;
  orderNumber: string | null;
  bidId: string | null;
  type: string;
  issuedAt: string;
  amountDisplay: string;
};

export default function CustomerInvoicesListClient({ initialData }: { initialData: CustomerInvoiceRow[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return initialData;
    const q = searchQuery.toLowerCase().trim();
    return initialData.filter((inv) => {
      const dateStr = new Date(inv.issuedAt).toLocaleDateString("en-IN").toLowerCase();
      const refLine = inv.orderNumber ?? (inv.bidId ? "bid request" : "");
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.type.toLowerCase().includes(q) ||
        refLine.toLowerCase().includes(q) ||
        dateStr.includes(q) ||
        inv.amountDisplay.includes(q)
      );
    });
  }, [initialData, searchQuery]);

  const columns: Column<CustomerInvoiceRow>[] = [
    {
      header: "Invoice #",
      key: "invoiceNumber",
      width: 140,
      nowrap: true,
      cellClassName: "font-mono text-xs font-semibold text-slate-800",
    },
    {
      header: "Order / bid",
      key: "ref",
      width: 160,
      cellClassName: "whitespace-normal",
      render: (inv) =>
        inv.orderId && inv.orderNumber ? (
          <Link
            href={`/customer/orders/${inv.orderId}`}
            className={`text-sm font-bold ${BRAND_TEXT} hover:underline`}
          >
            {inv.orderNumber}
          </Link>
        ) : inv.bidId ? (
          <Link href={`/customer/bids/${inv.bidId}`} className={`text-sm font-bold ${BRAND_TEXT} hover:underline`}>
            Bid request
          </Link>
        ) : (
          "—"
        ),
    },
    {
      header: "Type",
      key: "type",
      width: 110,
      nowrap: true,
      cellClassName: "text-xs text-slate-700",
      render: (inv) => inv.type.replace(/_/g, " "),
    },
    {
      header: "Date",
      key: "issuedAt",
      width: 120,
      nowrap: true,
      cellClassName: "text-xs text-slate-600",
      render: (inv) => new Date(inv.issuedAt).toLocaleDateString("en-IN"),
    },
    {
      header: "Amount (₹)",
      key: "amount",
      headerClassName: "text-right",
      cellClassName: "text-right text-xs font-black text-slate-900",
      nowrap: true,
      render: (inv) => inv.amountDisplay,
    },
    {
      header: "Actions",
      key: "actions",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (inv) => (
        <a
          href={`/api/customer/invoices/${inv.id}/download`}
          className={`inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-tight ${BRAND_TEXT} hover:underline`}
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          Download
        </a>
      ),
    },
  ];

  return (
    <CommonTable
      title="Invoices"
      subtitle={undefined}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Searching..."
      columns={columns}
      data={filteredData}
      keyExtractor={(inv) => inv.id}
      emptyMessage="No invoices yet"
    />
  );
}
