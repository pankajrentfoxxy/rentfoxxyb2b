import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { NormalizedTrackingEvent } from "@/lib/shipping";
import { trackShipment } from "@/lib/shipping";

export type CustomerTrackingPayload = {
  carrier: string;
  awb: string | null;
  events: NormalizedTrackingEvent[];
  estimatedDelivery: string | null;
  currentStatus: string | null;
  trackingUrl: string | null;
};

function eventsFromDbJson(raw: Prisma.JsonValue): NormalizedTrackingEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: NormalizedTrackingEvent[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const date = String(r.date ?? r.at ?? "");
    const status = String(r.status ?? r.label ?? "Update");
    const description = String(r.description ?? r.detail ?? "");
    const location = r.location != null ? String(r.location) : undefined;
    if (date) out.push({ date, status, description, location });
  }
  return out;
}

/**
 * For a customer's order: refresh tracking from Shiprocket when configured, persist to Shipment.events, return masked payload.
 */
export async function getCustomerOrderTracking(
  orderId: string,
  customerProfileId: string,
): Promise<CustomerTrackingPayload | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: customerProfileId },
    include: { shipment: true },
  });
  if (!order) return null;

  let events: NormalizedTrackingEvent[] = [];

  if (order.shipment?.awbNumber) {
    const remote = await trackShipment(order.shipment.awbNumber);
    if (remote.length > 0) {
      const asJson = remote as unknown as Prisma.InputJsonValue;
      await prisma.shipment.update({
        where: { orderId },
        data: { events: asJson },
      });
      events = remote;
    }
  }

  if (events.length === 0 && order.shipment?.events != null) {
    events = eventsFromDbJson(order.shipment.events);
  }

  if (events.length === 0 && order.shipment) {
    events = [
      {
        date: order.shipment.dispatchedAt.toISOString(),
        status: "Dispatched",
        description: `Tracking reference: ${order.shipment.awbNumber}`,
      },
    ];
  }

  events.push({
    date: order.createdAt.toISOString(),
    status: "Order placed",
    description: `Order ${order.orderNumber}`,
  });

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const currentStatus = events[0]?.status ?? null;
  const est = order.shipment?.deliveredAt
    ? null
    : new Date(order.createdAt.getTime() + 7 * 86400000);

  return {
    carrier: "Logistics Partner",
    awb: order.shipment?.awbNumber ?? null,
    events,
    estimatedDelivery: est ? est.toISOString() : null,
    currentStatus,
    trackingUrl: order.shipment?.trackingUrl ?? null,
  };
}
