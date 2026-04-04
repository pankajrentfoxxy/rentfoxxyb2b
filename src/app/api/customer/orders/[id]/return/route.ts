import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "No profile" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: params.id, customerId: profile.id },
    include: { shipment: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (order.status !== "DELIVERED" && order.status !== "DELIVERY_CONFIRMED") {
    return NextResponse.json({ error: "Return only after delivery" }, { status: 400 });
  }

  const anchor = order.shipment?.deliveredAt ?? order.updatedAt;
  const days = (Date.now() - anchor.getTime()) / (1000 * 60 * 60 * 24);
  if (days > 7) {
    return NextResponse.json({ error: "Return window expired (7 days)" }, { status: 400 });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "RETURN_REQUESTED" },
  });

  return NextResponse.json({ ok: true });
}
