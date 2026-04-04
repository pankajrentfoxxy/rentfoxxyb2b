import { BidStatus, OrderStatus } from "@prisma/client";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
  {
    variants: {
      tone: {
        neutral: "bg-slate-50 text-slate-700 ring-slate-200",
        blue: "bg-blue-50 text-blue-800 ring-blue-200",
        indigo: "bg-indigo-50 text-indigo-800 ring-indigo-200",
        green: "bg-green-50 text-green-800 ring-green-200",
        emerald: "bg-emerald-50 text-emerald-800 ring-emerald-200",
        yellow: "bg-amber-50 text-amber-900 ring-amber-200",
        red: "bg-red-50 text-red-800 ring-red-200",
        violet: "bg-violet-50 text-violet-800 ring-violet-200",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

const orderTone: Record<OrderStatus, VariantProps<typeof badge>["tone"]> = {
  PAYMENT_PENDING: "yellow",
  TOKEN_PAID: "yellow",
  STOCK_RESERVED: "yellow",
  BALANCE_OVERDUE: "red",
  BALANCE_PAID: "blue",
  ORDER_PLACED: "blue",
  ORDER_CONFIRMED: "blue",
  PACKED: "indigo",
  DISPATCHED: "indigo",
  OUT_FOR_DELIVERY: "indigo",
  DELIVERED: "green",
  DELIVERY_CONFIRMED: "green",
  PAYOUT_PENDING: "yellow",
  PAYOUT_RELEASED: "emerald",
  RETURN_REQUESTED: "violet",
  REFUNDED: "neutral",
  CANCELLED: "red",
  TOKEN_FORFEITED: "red",
};

const bidTone: Record<BidStatus, VariantProps<typeof badge>["tone"]> = {
  PENDING: "yellow",
  APPROVED: "green",
  REJECTED: "red",
  COUNTER_OFFERED: "blue",
  EXPIRED: "neutral",
  PAID: "emerald",
  CANCELLED: "red",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const tone = orderTone[status] ?? "neutral";
  return (
    <span className={cn(badge({ tone }), className)}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function BidStatusBadge({
  status,
  className,
}: {
  status: BidStatus;
  className?: string;
}) {
  const tone = bidTone[status] ?? "neutral";
  return (
    <span className={cn(badge({ tone }), className)}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
