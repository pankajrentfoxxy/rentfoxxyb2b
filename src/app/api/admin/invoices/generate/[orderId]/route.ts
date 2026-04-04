import { getAdminUserId } from "@/lib/admin-auth";
import { ensureTaxInvoiceForOrder } from "@/lib/invoice-generator";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "ORDER_PLACED",
  "ORDER_CONFIRMED",
  "PACKED",
  "DISPATCHED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELIVERY_CONFIRMED",
  "PAYOUT_PENDING",
  "PAYOUT_RELEASED",
  "RETURN_REQUESTED",
  "REFUNDED",
  "CANCELLED",
]);

export async function POST(_req: NextRequest, ctx: { params: Promise<{ orderId: string }> }) {
  const adminId = await getAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await ctx.params;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!ALLOWED.has(order.status)) {
    return NextResponse.json({ error: "Order must be placed or later to issue tax invoice" }, { status: 400 });
  }

  const result = await ensureTaxInvoiceForOrder(orderId);
  if (!result) {
    return NextResponse.json({ error: "Could not generate invoice for this order" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, invoiceId: result.invoiceId, invoiceNumber: result.invoiceNumber });
}
