import { getAppBaseUrl } from "@/lib/app-url";
import { OrderDispatched } from "@/emails/OrderDispatched";
import { sendEmail } from "@/lib/email";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { getVendorContext } from "@/lib/vendor-auth";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import * as React from "react";

export const dynamic = "force-dynamic";

type Body = {
  action?: "mark_packed" | "mark_dispatched" | "mark_delivered";
  carrier?: string;
  awbNumber?: string;
  trackingUrl?: string;
};

async function vendorOwnsAllItems(orderId: string, vendorId: string) {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    select: { listing: { select: { vendorId: true } } },
  });
  if (items.length === 0) return { ok: false as const, reason: "no_items" };
  const allSame = items.every((i) => i.listing.vendorId === vendorId);
  return { ok: allSame as boolean, reason: allSame ? undefined : "multi_vendor" };
}

export async function PUT(req: NextRequest, route: { params: Promise<{ id: string }> }) {
  const vctx = await getVendorContext();
  if (!vctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: orderId } = await route.params;
  const body = (await req.json()) as Body;

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      items: { some: { listing: { vendorId: vctx.vendorId } } },
    },
    include: { items: { include: { listing: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const exclusive = await vendorOwnsAllItems(orderId, vctx.vendorId);
  if (!exclusive.ok && exclusive.reason === "multi_vendor") {
    return NextResponse.json(
      {
        error:
          "This order includes items from multiple vendors. Status updates are disabled — contact support for split fulfilment.",
      },
      { status: 409 },
    );
  }

  const action = body.action;
  if (!action) {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  let nextStatus: OrderStatus | null = null;

  if (action === "mark_packed") {
    if (!["ORDER_PLACED", "ORDER_CONFIRMED"].includes(order.status)) {
      return NextResponse.json({ error: "Invalid state for pack" }, { status: 400 });
    }
    nextStatus = "PACKED";
  }

  if (action === "mark_dispatched") {
    if (order.status !== "PACKED") {
      return NextResponse.json({ error: "Order must be packed first" }, { status: 400 });
    }
    const carrier = body.carrier?.trim();
    const awb = body.awbNumber?.trim();
    if (!carrier || !awb) {
      return NextResponse.json({ error: "carrier and awbNumber required" }, { status: 400 });
    }
    nextStatus = "DISPATCHED";
    await prisma.$transaction([
      prisma.shipment.upsert({
        where: { orderId },
        create: {
          orderId,
          carrier,
          awbNumber: awb,
          trackingUrl: body.trackingUrl?.trim() || null,
        },
        update: {
          carrier,
          awbNumber: awb,
          trackingUrl: body.trackingUrl?.trim() || null,
          dispatchedAt: new Date(),
        },
      }),
      prisma.order.update({ where: { id: orderId }, data: { status: nextStatus } }),
    ]);

    const full = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: { include: { user: true } }, shipment: true },
    });
    if (full) {
      await createNotification({
        userId: full.customer.userId,
        type: NOTIFICATION_TYPES.ORDER_DISPATCHED,
        title: "Order dispatched",
        message: `Logistics Partner — AWB ${awb}`,
        link: `/customer/tracking/${orderId}`,
      });
      const em = full.customer.user.email;
      if (em) {
        const base = getAppBaseUrl();
        const estDate = new Date(full.createdAt.getTime() + 7 * 86400000).toLocaleDateString("en-IN");
        void sendEmail({
          to: em,
          subject: `Your order ${full.orderNumber} is on the way`,
          react: React.createElement(OrderDispatched, {
            customerName: full.customer.user.name ?? em,
            orderNumber: full.orderNumber,
            carrier: "Logistics Partner",
            awb,
            trackingUrl: body.trackingUrl?.trim() || full.shipment?.trackingUrl || null,
            estimatedDelivery: estDate,
            trackPortalUrl: `${base}/customer/tracking/${orderId}`,
          }),
        });
      }
    }

    return NextResponse.json({ ok: true, status: nextStatus });
  }

  if (action === "mark_delivered") {
    if (!["DISPATCHED", "OUT_FOR_DELIVERY"].includes(order.status)) {
      return NextResponse.json({ error: "Order must be dispatched first" }, { status: 400 });
    }
    const ship = await prisma.shipment.findUnique({ where: { orderId } });
    if (!ship) {
      return NextResponse.json({ error: "Shipment record missing" }, { status: 400 });
    }
    nextStatus = "DELIVERED";
    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { status: nextStatus } }),
      prisma.shipment.update({
        where: { orderId },
        data: { deliveredAt: new Date(), status: "delivered" },
      }),
    ]);

    const deliveredCust = await prisma.order.findUnique({
      where: { id: orderId },
      select: { customer: { select: { userId: true } }, orderNumber: true },
    });
    if (deliveredCust) {
      await createNotification({
        userId: deliveredCust.customer.userId,
        type: NOTIFICATION_TYPES.ORDER_DELIVERED,
        title: "Order delivered",
        message: `Order ${deliveredCust.orderNumber} was marked delivered.`,
        link: `/customer/orders/${orderId}`,
      });
    }

    return NextResponse.json({ ok: true, status: nextStatus });
  }

  if (nextStatus) {
    await prisma.order.update({ where: { id: orderId }, data: { status: nextStatus } });
    return NextResponse.json({ ok: true, status: nextStatus });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
