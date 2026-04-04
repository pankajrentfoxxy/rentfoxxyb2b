import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const list = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { label: "asc" }],
  });
  return NextResponse.json({ addresses: list });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const b = (await req.json()) as {
    label?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    isDefault?: boolean;
  };
  if (!b.label || !b.line1 || !b.city || !b.state || !b.pincode) {
    return NextResponse.json({ error: "Missing address fields" }, { status: 400 });
  }
  if (b.isDefault) {
    await prisma.address.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
  }
  const addr = await prisma.address.create({
    data: {
      userId: session.user.id,
      label: b.label,
      line1: b.line1,
      line2: b.line2,
      city: b.city,
      state: b.state,
      pincode: b.pincode,
      isDefault: !!b.isDefault,
    },
  });
  return NextResponse.json({ address: addr });
}
