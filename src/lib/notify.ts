import { BidApproved } from "@/emails/BidApproved";
import { OrderConfirmation } from "@/emails/OrderConfirmation";
import { getAppBaseUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { gstBreakdown } from "@/lib/gst";
import type { Shipment } from "@prisma/client";
import * as React from "react";

const sym = "₹";

export async function notifyOrderConfirmed(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      address: true,
      customer: { include: { user: true } },
      items: { include: { listing: { include: { product: true, vendor: { include: { user: true } } } } } },
    },
  });
  if (!order) return;

  const base = getAppBaseUrl();
  const trackUrl = `${base}/customer/orders/${order.id}`;
  const customer = order.customer.user;
  const customerName = customer.name ?? customer.email ?? "there";
  const addr = order.address;
  const deliveryAddress = [addr.line1, addr.line2, `${addr.city}, ${addr.state} ${addr.pincode}`]
    .filter(Boolean)
    .join("\n");

  const items = order.items.map((it) => ({
    name: it.listing.product.name,
    quantity: it.quantity,
    unitPrice: `${sym}${it.unitPrice.toLocaleString("en-IN")}`,
    lineTotal: `${sym}${it.subtotal.toLocaleString("en-IN")}`,
  }));

  const totalStr = `${sym}${order.totalAmount.toLocaleString("en-IN")}`;

  if (customer.email) {
    void sendEmail({
      to: customer.email,
      subject: `Order confirmed: ${order.orderNumber}`,
      react: React.createElement(OrderConfirmation, {
        customerName,
        orderNumber: order.orderNumber,
        orderId: order.id,
        items,
        total: totalStr,
        deliveryAddress,
        appBaseUrl: base,
      }),
    });
  }

  if (customer.phone) {
    const digits = customer.phone.replace(/\D/g, "");
    const e164 = digits.length === 10 ? `+91${digits}` : customer.phone.startsWith("+") ? customer.phone : `+${digits}`;
    void sendSMS(e164, `Order #${order.orderNumber} confirmed on Rentfoxxy! Track: ${trackUrl} -Rentfoxxy`);
    void sendWhatsAppTemplate({
      to: e164.replace(/^\+/, ""),
      templateName: "rentfoxxy_order_confirmation",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: customerName },
            { type: "text", text: order.orderNumber },
            { type: "text", text: order.totalAmount.toLocaleString("en-IN") },
            { type: "text", text: trackUrl },
          ],
        },
      ],
    });
  }

  await createNotification({
    userId: order.customer.userId,
    type: NOTIFICATION_TYPES.ORDER_PLACED,
    title: "Order confirmed",
    message: `Your order ${order.orderNumber} has been confirmed. Total ${totalStr}.`,
    link: `/customer/orders/${order.id}`,
  });

  const vendorUserIds = Array.from(new Set(order.items.map((i) => i.listing.vendor.userId)));
  for (const userId of vendorUserIds) {
    await createNotification({
      userId,
      type: NOTIFICATION_TYPES.ORDER_PLACED_VENDOR,
      title: "New order received",
      message: `Order ${order.orderNumber} includes your items. Fulfill from your vendor portal.`,
      link: `/vendor/orders`,
    });
  }
}

type BidApprovedCtx = {
  customerEmail?: string | null;
  customerName: string;
  customerUserId: string;
  bidId: string;
  productName: string;
  quantity: number;
  bidPricePerUnit: number;
  totalBidAmount: number;
  unitPrice: number;
  expiresAt: Date;
};

export async function notifyBidApproved(ctx: BidApprovedCtx) {
  const base = getAppBaseUrl();
  const bidUrl = `${base}/customer/bids/${ctx.bidId}`;
  const gst = gstBreakdown(ctx.totalBidAmount);
  const savePerUnit = ctx.unitPrice - ctx.bidPricePerUnit;
  const savingsPerUnit =
    savePerUnit > 0.01 ? `${sym}${savePerUnit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : null;

  if (ctx.customerEmail) {
    void sendEmail({
      to: ctx.customerEmail,
    subject: "Your price request was approved",
    react: React.createElement(BidApproved, {
      customerName: ctx.customerName,
      productName: ctx.productName,
      quantity: ctx.quantity,
      approvedPricePerUnit: `${sym}${ctx.bidPricePerUnit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
      totalAmount: `${sym}${gst.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
      savingsPerUnit,
      expiresAt: ctx.expiresAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      paymentLink: bidUrl,
    }),
    });
  }

  const user = await prisma.user.findUnique({ where: { id: ctx.customerUserId }, select: { phone: true } });
  if (user?.phone) {
    const digits = user.phone.replace(/\D/g, "");
    const e164 = digits.length === 10 ? `+91${digits}` : user.phone.startsWith("+") ? user.phone : `+${digits}`;
    void sendSMS(
      e164,
      `Your bid for ${ctx.productName} approved! Pay by ${ctx.expiresAt.toLocaleString("en-IN")}: ${bidUrl} -Rentfoxxy`,
    );
    void sendWhatsAppTemplate({
      to: e164.replace(/^\+/, ""),
      templateName: "rentfoxxy_bid_approved",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: ctx.customerName },
            { type: "text", text: ctx.productName },
            { type: "text", text: gst.total.toLocaleString("en-IN") },
            { type: "text", text: ctx.expiresAt.toLocaleString("en-IN") },
            { type: "text", text: bidUrl },
          ],
        },
      ],
    });
  }

  await createNotification({
    userId: ctx.customerUserId,
    type: NOTIFICATION_TYPES.BID_APPROVED,
    title: "Bid approved",
    message: `Your bid on ${ctx.productName} was approved. Pay within the offer window to secure stock.`,
    link: `/customer/bids/${ctx.bidId}`,
  });
}

export async function notifyOrderDispatched(orderId: string, shipment: Shipment) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: { include: { user: true } } },
  });
  if (!order) return;
  const base = getAppBaseUrl();
  const trackUrl = `${base}/customer/tracking/${order.id}`;
  const phone = order.customer.user.phone;
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    const e164 = digits.length === 10 ? `+91${digits}` : phone.startsWith("+") ? phone : `+${digits}`;
    void sendSMS(e164, `Order #${order.orderNumber} shipped! Track: ${trackUrl} -Rentfoxxy`);
    void sendWhatsAppTemplate({
      to: e164.replace(/^\+/, ""),
      templateName: "rentfoxxy_order_dispatched",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: order.orderNumber },
            { type: "text", text: shipment.deliveredAt?.toLocaleString("en-IN") ?? "—" },
            { type: "text", text: trackUrl },
          ],
        },
      ],
    });
  }
  await createNotification({
    userId: order.customer.userId,
    type: NOTIFICATION_TYPES.ORDER_DISPATCHED,
    title: "Order dispatched",
    message: `Order ${order.orderNumber} is on the way. AWB ${shipment.awbNumber}.`,
    link: `/customer/orders/${order.id}`,
  });
}
