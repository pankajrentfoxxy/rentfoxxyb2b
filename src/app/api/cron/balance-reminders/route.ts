import {
  sendBalanceReminderMail,
  sendTokenForfeitedMail,
} from "@/lib/order-emails";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function authCron(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/** Reminder schedule for 7-day balance window: T-48h, T-24h, T-2h, then forfeiture at T-0 */
export async function GET(req: NextRequest) {
  if (!authCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 3600 * 1000);
  const in24h = new Date(now.getTime() + 24 * 3600 * 1000);
  const in2h = new Date(now.getTime() + 2 * 3600 * 1000);

  const tokenOrders = await prisma.order.findMany({
    where: { status: "TOKEN_PAID", balanceDueAt: { gt: now } },
    include: { customer: { include: { user: true } } },
  });

  let reminders48 = 0;
  let reminders24 = 0;
  let reminders2 = 0;
  let forfeited = 0;

  for (const order of tokenOrders) {
    const due = order.balanceDueAt!;
    const token = order.tokenAmount ?? 0;
    const balance = Math.round((order.totalAmount - token) * 100) / 100;

    if (!order.balanceReminder48hSent && due <= in48h && due > in24h) {
      await prisma.order.update({
        where: { id: order.id },
        data: { balanceReminder48hSent: true },
      });
      await createNotification({
        userId: order.customer.userId,
        type: NOTIFICATION_TYPES.BALANCE_DUE_SOON,
        title: "Balance due in less than 48 hours",
        message: `Pay ₹${balance.toLocaleString("en-IN")} for ${order.orderNumber} within 7 days of token payment.`,
        link: `/customer/orders/${order.id}`,
      });
      const email = order.customer.user.email;
      if (email) {
        void sendBalanceReminderMail(
          order.id,
          "48h",
          order.orderNumber,
          email,
          order.customer.user.name,
          balance,
          due,
        );
      }
      reminders48++;
    } else if (!order.balanceReminder24hSent && due <= in24h && due > in2h) {
      await prisma.order.update({
        where: { id: order.id },
        data: { balanceReminder24hSent: true },
      });
      await createNotification({
        userId: order.customer.userId,
        type: NOTIFICATION_TYPES.BALANCE_DUE_SOON,
        title: "Balance due in less than 24 hours",
        message: `Pay ₹${balance.toLocaleString("en-IN")} for ${order.orderNumber} to keep your reservation.`,
        link: `/customer/orders/${order.id}`,
      });
      const email2 = order.customer.user.email;
      if (email2) {
        void sendBalanceReminderMail(
          order.id,
          "24h",
          order.orderNumber,
          email2,
          order.customer.user.name,
          balance,
          due,
        );
      }
      reminders24++;
    } else if (!order.balanceReminder2hSent && due <= in2h && due > now) {
      await prisma.order.update({
        where: { id: order.id },
        data: { balanceReminder2hSent: true },
      });
      await createNotification({
        userId: order.customer.userId,
        type: NOTIFICATION_TYPES.BALANCE_DUE_URGENT,
        title: "Urgent: balance due in 2 hours",
        message: `Complete ₹${balance.toLocaleString("en-IN")} for ${order.orderNumber} or your token may be forfeited.`,
        link: `/customer/orders/${order.id}`,
      });
      const email3 = order.customer.user.email;
      if (email3) {
        void sendBalanceReminderMail(
          order.id,
          "2h",
          order.orderNumber,
          email3,
          order.customer.user.name,
          balance,
          due,
        );
      }
      reminders2++;
    }
  }

  const overdue = await prisma.order.findMany({
    where: { status: "TOKEN_PAID", balanceDueAt: { lte: now } },
    include: {
      items: true,
      customer: { include: { user: true } },
      bid: { include: { listing: { include: { vendor: { include: { user: true } } } } } },
    },
  });

  for (const order of overdue) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "TOKEN_FORFEITED",
        isTokenForfeited: true,
        tokenForfeitedAt: now,
      },
    });
    forfeited++;
    void sendTokenForfeitedMail(order.id);
    await createNotification({
      userId: order.customer.userId,
      type: NOTIFICATION_TYPES.TOKEN_FORFEITED,
      title: "Token forfeited — balance not paid in 7 days",
      message: `Order ${order.orderNumber}: the 5% token is non-refundable per policy.`,
      link: `/customer/orders/${order.id}`,
    });
  }

  return NextResponse.json({
    ok: true,
    reminders48h: reminders48,
    reminders24h: reminders24,
    reminders2h: reminders2,
    forfeited,
  });
}
