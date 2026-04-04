import { getAdminUserId } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const ALL: OrderStatus[] = [
  "PAYMENT_PENDING",
  "TOKEN_PAID",
  "STOCK_RESERVED",
  "BALANCE_OVERDUE",
  "BALANCE_PAID",
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
  "TOKEN_FORFEITED",
];

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const adminId = await getAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await req.json()) as { status?: OrderStatus; adminNotes?: string | null };

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: { status?: OrderStatus; adminNotes?: string | null } = {};

  if (body.status && ALL.includes(body.status)) {
    data.status = body.status;
  }

  if (body.adminNotes !== undefined) {
    data.adminNotes = body.adminNotes === null ? null : String(body.adminNotes).slice(0, 8000);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  await prisma.order.update({ where: { id }, data });

  return NextResponse.json({ ok: true });
}
