"use client";

import type { OrderStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const STATUSES: OrderStatus[] = [
  "PAYMENT_PENDING",
  "TOKEN_PAID",
  "STOCK_RESERVED",
  "BALANCE_OVERDUE",
  "BALANCE_PAID",
  "ORDER_PLACED",
  "ORDER_CONFIRMED",
  "PACKED",
  "DISPATCHED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELIVERY_CONFIRMED",
  "PAYOUT_PENDING",
  "PAYOUT_RELEASED",
  "RETURN_REQUESTED",
  "REFUNDED",
  "CANCELLED",
  "TOKEN_FORFEITED",
];

export function AdminOrdersFilter({
  vendors,
  initial,
}: {
  vendors: { id: string; companyName: string }[];
  initial: {
    vendorId: string;
    status: string;
    dateFrom: string;
    dateTo: string;
    minAmount: string;
    maxAmount: string;
    bidOnly: boolean;
  };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function apply(formData: FormData) {
    const q = new URLSearchParams();
    const v = formData.get("vendorId") as string;
    const st = formData.get("status") as string;
    const df = formData.get("dateFrom") as string;
    const dt = formData.get("dateTo") as string;
    const minA = formData.get("minAmount") as string;
    const maxA = formData.get("maxAmount") as string;
    const bid = formData.get("bidOnly") === "on";
    if (v) q.set("vendorId", v);
    if (st) q.set("status", st);
    if (df) q.set("dateFrom", df);
    if (dt) q.set("dateTo", dt);
    if (minA) q.set("minAmount", minA);
    if (maxA) q.set("maxAmount", maxA);
    if (bid) q.set("bidOnly", "1");
    start(() => router.push(`/admin/orders?${q.toString()}`));
  }

  const exportHref = (() => {
    const q = new URLSearchParams();
    if (initial.vendorId) q.set("vendorId", initial.vendorId);
    if (initial.status) q.set("status", initial.status);
    if (initial.dateFrom) q.set("dateFrom", initial.dateFrom);
    if (initial.dateTo) q.set("dateTo", initial.dateTo);
    if (initial.minAmount) q.set("minAmount", initial.minAmount);
    if (initial.maxAmount) q.set("maxAmount", initial.maxAmount);
    if (initial.bidOnly) q.set("bidOnly", "1");
    return `/api/admin/orders/export?${q.toString()}`;
  })();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply(new FormData(e.currentTarget));
      }}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <label className="text-xs font-medium text-slate-700">
        Vendor
        <select
          name="vendorId"
          defaultValue={initial.vendorId}
          className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
        >
          <option value="">All</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.companyName}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-medium text-slate-700">
        Status
        <select
          name="status"
          defaultValue={initial.status}
          className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
        >
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-medium text-slate-700">
        From
        <input
          type="date"
          name="dateFrom"
          defaultValue={initial.dateFrom}
          className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="text-xs font-medium text-slate-700">
        To
        <input
          type="date"
          name="dateTo"
          defaultValue={initial.dateTo}
          className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="text-xs font-medium text-slate-700">
        Min ₹
        <input
          name="minAmount"
          defaultValue={initial.minAmount}
          className="mt-1 block w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="text-xs font-medium text-slate-700">
        Max ₹
        <input
          name="maxAmount"
          defaultValue={initial.maxAmount}
          className="mt-1 block w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
        <input type="checkbox" name="bidOnly" defaultChecked={initial.bidOnly} className="mt-3" />
        Bid orders only
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        Apply
      </button>
      <a
        href={exportHref}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800"
      >
        Export CSV
      </a>
    </form>
  );
}
