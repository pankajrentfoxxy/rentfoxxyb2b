import { prisma } from "@/lib/prisma";

/** Phase 6 notification types + extensions used elsewhere in the app */
export const NOTIFICATION_TYPES = {
  BID_SUBMITTED: "BID_SUBMITTED",
  BID_APPROVED: "BID_APPROVED",
  BID_REJECTED: "BID_REJECTED",
  BID_EXPIRED: "BID_EXPIRED",
  BID_COUNTER: "BID_COUNTER",
  BID_EXTENDED: "BID_EXTENDED",
  ORDER_PLACED: "ORDER_PLACED",
  ORDER_PLACED_VENDOR: "ORDER_PLACED_VENDOR",
  ORDER_DISPATCHED: "ORDER_DISPATCHED",
  ORDER_PACKED: "ORDER_PACKED",
  ORDER_DELIVERED: "ORDER_DELIVERED",
  PAYOUT_RELEASED: "PAYOUT_RELEASED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  INVOICE_READY: "INVOICE_READY",
  SUPPORT_TICKET: "SUPPORT_TICKET",
  LISTING_GRADE_C_APPROVED: "LISTING_GRADE_C_APPROVED",
  REVIEW_THANKS: "REVIEW_THANKS",
  TOKEN_RECEIVED: "TOKEN_RECEIVED",
  BALANCE_DUE_SOON: "BALANCE_DUE_SOON",
  BALANCE_DUE_URGENT: "BALANCE_DUE_URGENT",
  TOKEN_FORFEITED: "TOKEN_FORFEITED",
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export async function createNotification(input: {
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  link?: string | null;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? undefined,
    },
  });
}
