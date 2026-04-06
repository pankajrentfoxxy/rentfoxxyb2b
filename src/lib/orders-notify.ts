import { notifyOrderConfirmed } from "@/lib/notify";

export async function notifyOrderPlaced(orderId: string) {
  await notifyOrderConfirmed(orderId);
}
