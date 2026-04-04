"use client";

import { DataTable } from "@/components/shared/DataTable";
import type { OrderStatus } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useMemo } from "react";

export type CustomerOrderRow = {
  id: string;
  orderNumber: string;
  createdAt: string;
  itemCount: number;
  totalAmount: number;
  status: OrderStatus;
};

export function CustomerOrdersTable({ data }: { data: CustomerOrderRow[] }) {
  const columns = useMemo<ColumnDef<CustomerOrderRow>[]>(
    () => [
      {
        accessorKey: "orderNumber",
        header: "Order #",
        cell: ({ row }) => (
          <Link
            href={`/customer/orders/${row.original.id}`}
            className="font-mono font-medium text-accent hover:underline"
          >
            {row.original.orderNumber}
          </Link>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("en-IN"),
      },
      {
        accessorKey: "itemCount",
        header: "Items",
      },
      {
        accessorKey: "totalAmount",
        header: "Amount",
        cell: ({ row }) => `₹${row.original.totalAmount.toLocaleString("en-IN")}`,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className="capitalize">
            {row.original.status.toLowerCase().replace(/_/g, " ")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Link href={`/customer/orders/${row.original.id}`} className="text-sm text-accent hover:underline">
            View
          </Link>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      filterColumnId="orderNumber"
      filterPlaceholder="Search order number…"
      pageSize={15}
    />
  );
}
