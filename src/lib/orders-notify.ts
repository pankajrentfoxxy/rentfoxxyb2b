import { getAppBaseUrl } from "@/lib/app-url";
import { OrderConfirmation } from "@/emails/OrderConfirmation";
import { sendEmail } from "@/lib/email";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import * as React from "react";

export async function notifyOrderPlaced(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      address: true,
      customer: { include: { user: true } },
      items: { include: { listing: { include: { product: true, vendor: { include: { user: true } } } } } },
    },
  });
  if (!order) return;

  const currency = "₹";
  const totalStr = `${currency}${order.totalAmount.toLocaleString("en-IN")}`;
  const base = getAppBaseUrl();
  const customerName = order.customer.user.name ?? order.customer.user.email ?? "there";
  const addr = order.address;
  const deliveryAddress = [addr.line1, addr.line2, `${addr.city}, ${addr.state} ${addr.pincode}`]
    .filter(Boolean)
    .join("\n");

  const items = order.items.map((it) => ({
    name: it.listing.product.name,
    quantity: it.quantity,
    unitPrice: `${currency}${it.unitPrice.toLocaleString("en-IN")}`,
    lineTotal: `${currency}${it.subtotal.toLocaleString("en-IN")}`,
  }));

  if (order.customer.user.email) {
    void sendEmail({
      to: order.customer.user.email,
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
