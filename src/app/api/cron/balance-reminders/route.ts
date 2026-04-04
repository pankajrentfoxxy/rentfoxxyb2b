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

export async function GET(req: NextRequest) {
  if (!authCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in12h = new Date(now.getTime() + 12 * 3600 * 1000);
  const in2h = new Date(now.getTime() + 2 * 3600 * 1000);

  const tokenOrders = await prisma.order.findMany({
    where: { status: "TOKEN_PAID", balanceDueAt: { gt: now } },
    include: { customer: { include: { user: true } } },
  });

  let reminders12 = 0;
  let reminders2 = 0;
  let forfeited = 0;

  for (const order of tokenOrders) {
    const due = order.balanceDueAt!;
    const token = order.tokenAmount ?? 0;
    const balance = Math.round((order.totalAmount - token) * 100) / 100;

    if (!order.balanceReminder12hSent && due <= in12h && due > in2h) {
      await prisma.order.update({
        where: { id: order.id },
        data: { balanceReminder12hSent: true },
      });
      await createNotification({
        userId: order.customer.userId,
        type: NOTIFICATION_TYPES.BALANCE_DUE_SOON,
        title: "Balance due in less than 12 hours",
        message: `Pay ₹${balance.toLocaleString("en-IN")} for ${order.orderNumber} to keep your reservation.`,
        link: `/customer/orders/${order.id}`,
      });
      reminders12++;
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
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.productListing.update({
          where: { id: item.listingId },
          data: { stockQty: { increment: item.quantity } },
        });
      }
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "TOKEN_FORFEITED",
          isTokenForfeited: true,
          tokenForfeitedAt: now,
        },
      });
      if (order.bidId) {
        await tx.bid.update({
          where: { id: order.bidId },
          data: { status: "CANCELLED" },
        });
      }
    });

    await createNotification({
      userId: order.customer.userId,
      type: NOTIFICATION_TYPES.TOKEN_FORFEITED,
      title: "Reservation expired",
      message: `Balance for ${order.orderNumber} was not paid in time. Stock has been released.`,
      link: `/customer/orders/${order.id}`,
    });

    const vendorUid = order.bid?.listing.vendor.userId;
    if (vendorUid) {
      await createNotification({
        userId: vendorUid,
        type: NOTIFICATION_TYPES.TOKEN_FORFEITED,
        title: "Buyer defaulted on balance",
        message: `Order ${order.orderNumber} — stock released after balance deadline.`,
        link: `/vendor/orders`,
      });
    }

    forfeited++;
  }

  return NextResponse.json({ ok: true, reminders12, reminders2, forfeited });
}
