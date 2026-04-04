import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CartLine } from "@/types/cart";
import { NextRequest, NextResponse } from "next/server";

async function getCustomerProfile(userId: string) {
  return prisma.customerProfile.findUnique({ where: { userId } });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await getCustomerProfile(session.user.id);
  if (!profile) return NextResponse.json({ items: [] });

  const cart = await prisma.cart.findUnique({ where: { customerId: profile.id } });
  return NextResponse.json({ items: (cart?.items as CartLine[]) ?? [] });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { items: CartLine[] };
  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const profile = await getCustomerProfile(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "No customer profile" }, { status: 400 });
  }

  await prisma.cart.upsert({
    where: { customerId: profile.id },
    create: {
      customerId: profile.id,
      items: body.items as object[],
    },
    update: { items: body.items as object[] },
  });

  return NextResponse.json({ ok: true });
}
