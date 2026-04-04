import type { OrderStatus } from "@prisma/client";

export type OrderFilterTab = "all" | "processing" | "dispatched" | "delivered" | "cancelled";

const PROCESSING: OrderStatus[] = [
  "PAYMENT_PENDING",
  "TOKEN_PAID",
  "STOCK_RESERVED",
  "BALANCE_OVERDUE",
  "BALANCE_PAID",
  "ORDER_PLACED",
  "ORDER_CONFIRMED",
  "PACKED",
];

const DISPATCHED: OrderStatus[] = ["DISPATCHED", "OUT_FOR_DELIVERY"];

const DELIVERED: OrderStatus[] = [
  "DELIVERED",
  "DELIVERY_CONFIRMED",
  "PAYOUT_PENDING",
  "PAYOUT_RELEASED",
];

const CANCELLED: OrderStatus[] = [
  "CANCELLED",
  "REFUNDED",
  "RETURN_REQUESTED",
  "TOKEN_FORFEITED",
];

export function orderMatchesFilter(status: OrderStatus, tab: OrderFilterTab): boolean {
  if (tab === "all") return true;
  if (tab === "processing") return PROCESSING.includes(status);
  if (tab === "dispatched") return DISPATCHED.includes(status);
  if (tab === "delivered") return DELIVERED.includes(status);
  if (tab === "cancelled") return CANCELLED.includes(status);
  return true;
}

export function orderTimelineSteps(status: OrderStatus): { title: string; done: boolean }[] {
  const rank = (s: OrderStatus): number => {
    if (s === "PAYMENT_PENDING") return 0;
    if (s === "TOKEN_PAID" || s === "STOCK_RESERVED" || s === "BALANCE_OVERDUE" || s === "BALANCE_PAID") {
      return 0;
    }
    if (s === "ORDER_PLACED") return 1;
    if (s === "ORDER_CONFIRMED") return 2;
    if (s === "PACKED") return 3;
    if (s === "DISPATCHED" || s === "OUT_FOR_DELIVERY") return 4;
    if (
      s === "DELIVERED" ||
      s === "DELIVERY_CONFIRMED" ||
      s === "PAYOUT_PENDING" ||
      s === "PAYOUT_RELEASED"
    )
      return 5;
    return -1;
  };

  const r = rank(status);
  const labels = [
    { title: "Placed", done: r >= 1 },
    { title: "Confirmed", done: r >= 2 },
    { title: "Packed", done: r >= 3 },
    { title: "Dispatched", done: r >= 4 },
    { title: "Delivered", done: r >= 5 },
  ];

  if (
    status === "PAYMENT_PENDING" ||
    status === "TOKEN_PAID" ||
    status === "STOCK_RESERVED" ||
    status === "BALANCE_OVERDUE" ||
    status === "BALANCE_PAID"
  ) {
    const isToken = status === "TOKEN_PAID" || status === "STOCK_RESERVED" || status === "BALANCE_OVERDUE";
    return [
      { title: status === "PAYMENT_PENDING" ? "Payment pending" : isToken ? "Balance due" : "Payment", done: false },
      ...labels.slice(1).map((l) => ({ ...l, done: false })),
    ];
  }

  if (CANCELLED.includes(status)) {
    return labels.map((l) => ({ ...l, done: false }));
  }

  return labels;
}
