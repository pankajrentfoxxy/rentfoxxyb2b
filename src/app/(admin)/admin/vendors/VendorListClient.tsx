"use client";

import React, { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { Eye, Edit } from 'lucide-react';
import { EditVendorDialog } from '@/components/admin/EditVendorDialog';
import { CommonTable, Column, BRAND_RING, BRAND_TEXT, BRAND_COLOR, BRAND_SHADOW } from '@/components/commonStyle/CommonTable';

export type VendorData = {
  id: string;
  companyName: string;
  gstin: string;
  email: string | null;
  status: string;
  score: number | null;
  commission: string;
  orders: number;
  revenue: number;
};

export default function VendorListClient({
  initialData,
  pendingOnly,
  lowScore
}: {
  initialData: VendorData[];
  pendingOnly: boolean;
  lowScore: boolean;
}) {
  const router = useRouter();
  const [, startRefresh] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [editVendorId, setEditVendorId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    if (!searchQuery) return initialData;
    const lowerQuery = searchQuery.toLowerCase();
    return initialData.filter(v =>
      v.companyName.toLowerCase().includes(lowerQuery) ||
      (v.gstin && v.gstin.toLowerCase().includes(lowerQuery)) ||
      (v.email && v.email.toLowerCase().includes(lowerQuery))
    );
  }, [initialData, searchQuery]);

  const columns: Column<VendorData>[] = [
    {
      header: "Company",
      key: "companyName",
      width: 350,
      render: (v) => (
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-slate-800 text-sm group-hover:text-amber-700 transition-colors">
            {v.companyName}
          </span>
        </div>
      )
    },
    {
      header: "GSTIN",
      key: "gstin",
      cellClassName: "text-[12px] text-slate-500 font-mono",
    },
    {
      header: "Email",
      key: "email",
      cellClassName: "text-[12px] text-slate-500",
    },
    {
      header: "Status",
      key: "status",
      render: (v) => {
        const isActive = v.status === 'APPROVED' || v.status === 'ACTIVE';
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight ${isActive
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}>
            {v.status.replace(/_/g, ' ')}
          </span>
        );
      }
    },
    {
      header: "Score",
      key: "score",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (v) => (
        <span className={`text-sm font-black ${v.score === null || v.score === undefined ? 'text-slate-200' : v.score < 60 ? 'text-rose-500' : 'text-emerald-600'
          }`}>
          {v.score !== null && v.score !== undefined ? v.score : '--'}
        </span>
      )
    },
    {
      header: "Commission",
      key: "commission",
      headerClassName: "text-right",
      cellClassName: "text-right text-xs font-bold text-slate-700",
    },
    {
      header: "Orders",
      key: "orders",
      headerClassName: "text-center",
      cellClassName: "text-center text-xs font-bold text-slate-700",
    },
    {
      header: "Revenue",
      key: "revenue",
      headerClassName: "text-right",
      cellClassName: "text-right text-xs font-black text-slate-900",
      render: (v) => `₹${v.revenue.toLocaleString("en-IN")}`
    },
    {
      header: "Actions",
      key: "actions",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (v) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            className={`rounded border border-amber-100 px-3 py-1 text-[11px] font-black transition-all ${BRAND_TEXT} hover:border-amber-600 hover:bg-amber-600 hover:text-white`}
            onClick={() => setEditVendorId(v.id)}
            aria-label={`Edit ${v.companyName}`}
          >
            <Edit size={16} />
          </button>
          <Link href={`/admin/vendors/${v.id}`}>
            <button
              type="button"
              className={`rounded border border-amber-100 px-3 py-1 text-[11px] font-black transition-all ${BRAND_TEXT} hover:border-amber-600 hover:bg-amber-600 hover:text-white`}
              aria-label={`View ${v.companyName}`}
            >
              <Eye size={16} />
            </button>
          </Link>
        </div>
      )
    }
  ];

  const tabs = [
    { label: "All", href: "/admin/vendors", active: !pendingOnly && !lowScore },
    { label: "Pending Approval", href: "/admin/vendors?tab=pending", active: pendingOnly },
    { label: "Score below 60", href: "/admin/vendors?lowScore=1", active: lowScore && !pendingOnly },
  ];

  return (
    <>
      <EditVendorDialog
        vendorId={editVendorId}
        onOpenChange={(next) => {
          if (!next) setEditVendorId(null);
        }}
        onSaved={() => startRefresh(() => router.refresh())}
      />
      <CommonTable
        actionButton={null}
        tabs={tabs}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by company, GSTIN or email..."
        columns={columns}
        data={filteredData}
        keyExtractor={(v) => v.id}
      />
    </>
  );
}
