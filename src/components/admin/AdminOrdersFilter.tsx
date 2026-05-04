"use client";

import type { OrderStatus } from "@prisma/client";
import {
  CommonGenericInput,
  CommonNumberInput,
  CommonSearchableSelect,
  type SearchableSelectOption,
} from "@/components/commonStyle/CommonFormFields";
import { BRAND_COLOR } from "@/components/commonStyle/CommonTable";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";

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

const STATUS_FILTER_OPTIONS: SearchableSelectOption[] = [
  { value: "", label: "All statuses" },
  ...STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") })),
];

export type AdminOrdersFilterInitial = {
  vendorId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
  bidOnly: boolean;
};

export function AdminOrdersFilter({
  vendors,
  initial,
  variant = "inline",
  onApplied,
}: {
  vendors: { id: string; companyName: string }[];
  initial: AdminOrdersFilterInitial;
  /** `drawer`: full-width fields for a narrow panel. */
  variant?: "inline" | "drawer";
  /** Called after navigation to filtered URL (e.g. close drawer). */
  onApplied?: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const vendorOptions = useMemo<SearchableSelectOption[]>(
    () => [{ value: "", label: "All vendors" }, ...vendors.map((v) => ({ value: v.id, label: v.companyName }))],
    [vendors],
  );

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
    start(() => {
      router.push(`/admin/orders?${q.toString()}`);
      onApplied?.();
    });
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

  const searchableSelectFieldClass =
    variant === "drawer" ? "mt-1 w-full min-w-0 max-w-full" : "mt-1 min-w-[10rem] max-w-[16rem]";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply(new FormData(e.currentTarget));
      }}
      className={cn(
        variant === "inline"
          ? "flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          : "flex w-full flex-col gap-4 rounded-none border-0 bg-transparent p-0 shadow-none",
      )}
    >
      <label className="text-xs font-medium text-slate-700">
        Vendor
        <CommonSearchableSelect
          name="vendorId"
          options={vendorOptions}
          defaultValue={initial.vendorId}
          placeholder="Choose vendor…"
          emptyMessage="No vendors match"
          className={searchableSelectFieldClass}
          maxSuggestions={80}
        />
      </label>
      <label className="text-xs font-medium text-slate-700">
        Status
        <CommonSearchableSelect
          name="status"
          options={STATUS_FILTER_OPTIONS}
          defaultValue={initial.status}
          placeholder="Choose status…"
          emptyMessage="No status matches"
          className={searchableSelectFieldClass}
          maxSuggestions={40}
        />
      </label>
      <label className="text-xs font-medium text-slate-700">
        From
        <CommonGenericInput
          type="date"
          name="dateFrom"
          defaultValue={initial.dateFrom}
          className={cn(variant === "drawer" ? "mt-1 w-full min-w-0" : "mt-1 min-w-[11rem]")}
        />
      </label>
      <label className="text-xs font-medium text-slate-700">
        To
        <CommonGenericInput
          type="date"
          name="dateTo"
          defaultValue={initial.dateTo}
          className={cn(variant === "drawer" ? "mt-1 w-full min-w-0" : "mt-1 min-w-[11rem]")}
        />
      </label>
      <label className="text-xs font-medium text-slate-700">
        Min ₹
        <CommonNumberInput
          name="minAmount"
          defaultValue={initial.minAmount}
          className={cn(variant === "drawer" ? "mt-1 w-full" : "mt-1 w-28")}
          inputClassName="min-w-0"
        />
      </label>
      <label className="text-xs font-medium text-slate-700">
        Max ₹
        <CommonNumberInput
          name="maxAmount"
          defaultValue={initial.maxAmount}
          className={cn(variant === "drawer" ? "mt-1 w-full" : "mt-1 w-28")}
          inputClassName="min-w-0"
        />
      </label>
      <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
        <input
          type="checkbox"
          name="bidOnly"
          defaultChecked={initial.bidOnly}
          className="mt-3 h-4 w-4 shrink-0 rounded border-slate-300 accent-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        Bid orders only
      </label>
      <div
        className={cn(
          "flex gap-2",
          variant === "drawer" ? "mt-2 flex-col sm:flex-row" : "items-end",
        )}
      >
        <button
          type="submit"
          disabled={pending}
          className={cn(
            BRAND_COLOR,
            variant === "drawer" && "w-full sm:flex-1",
            "rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 disabled:opacity-50",
          )}
        >
          Apply
        </button>
        <a
          href={exportHref}
          className={cn(
            "rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-amber-300 hover:text-amber-700",
            variant === "drawer" && "w-full sm:flex-1",
          )}
        >
          Export CSV
        </a>
      </div>
    </form>
  );
}
