import type { OrderStatus } from "@prisma/client";

/** Anchor date for "delivered" UX (reviews, returns). */
export function orderDeliveryAnchor(
  status: OrderStatus,
  shipmentDeliveredAt: Date | null | undefined,
  orderUpdatedAt: Date,
): Date | null {
  if (status !== "DELIVERED" && status !== "DELIVERY_CONFIRMED") return null;
  return shipmentDeliveredAt ?? orderUpdatedAt;
}

/** Within `days` after delivery anchor. */
export function isWithinDaysAfterDelivery(
  anchor: Date | null,
  days: number,
  now = new Date(),
): boolean {
  if (!anchor) return false;
  const ms = now.getTime() - anchor.getTime();
  if (ms <= 0) return false;
  return ms < days * 24 * 60 * 60 * 1000;
}
