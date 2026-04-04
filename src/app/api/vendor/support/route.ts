import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { getVendorContext } from "@/lib/vendor-auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const ctx = await getVendorContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    subject?: string;
    orderId?: string | null;
    message?: string;
  };

  if (!body.subject?.trim() || !body.message?.trim()) {
    return NextResponse.json({ error: "Subject and message required" }, { status: 400 });
  }

  if (body.orderId) {
    const order = await prisma.order.findFirst({
      where: {
        id: body.orderId,
        items: { some: { listing: { vendorId: ctx.vendorId } } },
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Invalid order for this vendor" }, { status: 400 });
    }
  }

  const initialMessages: Prisma.JsonArray = [
    {
      at: new Date().toISOString(),
      from: "vendor",
      text: body.message.trim(),
    },
  ];

  const ticket = await prisma.supportTicket.create({
    data: {
      raisedById: ctx.userId,
      orderId: body.orderId ?? null,
      subject: body.subject.trim(),
      messages: initialMessages,
    },
  });

  await createNotification({
    userId: ctx.userId,
    type: NOTIFICATION_TYPES.SUPPORT_TICKET,
    title: "Support request received",
    message: `Ticket logged: ${ticket.subject}`,
    link: "/vendor/orders",
  });

  return NextResponse.json({ ok: true, ticketId: ticket.id });
}
