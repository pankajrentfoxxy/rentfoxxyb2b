import { auth } from "@/lib/auth";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
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
    const profile = await prisma.customerProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!profile) {
      return NextResponse.json({ error: "No profile" }, { status: 400 });
    }
    const order = await prisma.order.findFirst({
      where: { id: body.orderId, customerId: profile.id },
    });
    if (!order) {
      return NextResponse.json({ error: "Invalid order" }, { status: 400 });
    }
  }

  const initialMessages: Prisma.JsonArray = [
    {
      at: new Date().toISOString(),
      from: "customer",
      text: body.message.trim(),
    },
  ];

  const ticket = await prisma.supportTicket.create({
    data: {
      raisedById: session.user.id,
      orderId: body.orderId ?? null,
      subject: body.subject.trim(),
      messages: initialMessages,
    },
  });

  await createNotification({
    userId: session.user.id,
    type: NOTIFICATION_TYPES.SUPPORT_TICKET,
    title: "Support request received",
    message: `Ticket logged: ${ticket.subject}`,
    link: "/customer/orders",
  });

  return NextResponse.json({ ok: true, ticketId: ticket.id });
}
