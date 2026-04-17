/** v1.7 portal status chips — order / bid / fulfilment states */
export function getStatusBadge(status: string): string {
  const map: Record<string, string> = {
    ORDER_PLACED: "bg-blue-50 text-blue-700 border border-blue-200",
    ORDER_CONFIRMED: "bg-blue-100 text-blue-800 border border-blue-300",
    PACKED: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    DISPATCHED: "bg-purple-50 text-purple-700 border border-purple-200",
    OUT_FOR_DELIVERY: "bg-purple-50 text-purple-700 border border-purple-200",
    DELIVERED: "bg-verified-bg text-verified-text border border-verified-border",
    DELIVERY_CONFIRMED: "bg-verified-bg text-verified-text border border-verified-border",
    PAYOUT_PENDING: "bg-amber-bg text-amber-dark border border-amber-border",
    PAYOUT_RELEASED: "bg-verified-bg text-verified-text border border-verified-border",
    TOKEN_PAID: "bg-amber-bg text-amber-dark border border-amber-border",
    STOCK_RESERVED: "bg-amber-bg text-amber-dark border border-amber-border",
    BALANCE_PAID: "bg-blue-50 text-blue-700 border border-blue-200",
    BALANCE_OVERDUE: "bg-red-50 text-red-700 border border-red-200",
    PAYMENT_PENDING: "bg-amber-bg text-amber-dark border border-amber-border",
    TOKEN_FORFEITED: "bg-red-50 text-red-700 border border-red-200",
    CANCELLED: "bg-red-50 text-red-700 border border-red-200",
    REFUNDED: "bg-red-50 text-red-700 border border-red-200",
    RETURN_REQUESTED: "bg-amber-bg text-amber-dark border border-amber-border",
    BID_PENDING: "bg-amber-bg text-amber-dark border border-amber-border",
    PENDING: "bg-amber-bg text-amber-dark border border-amber-border",
    APPROVED: "bg-verified-bg text-verified-text border border-verified-border",
    BID_APPROVED: "bg-verified-bg text-verified-text border border-verified-border",
    COUNTER_OFFERED: "bg-amber-bg text-amber-dark border border-amber-border",
    REJECTED: "bg-red-50 text-red-700 border border-red-200",
    BID_REJECTED: "bg-red-50 text-red-700 border border-red-200",
  };
  return map[status] ?? "bg-surface text-ink-muted border border-border";
}

export function statusBadgeLabel(status: string): string {
  return status.replace(/_/g, " ").toLowerCase();
}
