import { prisma } from "@/lib/prisma";

export async function nextOrderNumber(): Promise<string> {
  const settings = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
  const prefix = settings?.orderPrefix ?? "RFX-ORD";
  const count = await prisma.order.count();
  const seq = String(count + 1).padStart(6, "0");
  return `${prefix}-${seq}`;
}
