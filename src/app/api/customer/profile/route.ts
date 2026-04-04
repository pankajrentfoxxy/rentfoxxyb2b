import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { customerProfile: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
    companyName: user.customerProfile?.companyName ?? null,
    gstin: user.customerProfile?.gstin ?? null,
    notifyEmailOrder: true,
    notifyEmailBid: true,
    notifyEmailPayout: false,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    name?: string | null;
    phone?: string | null;
    companyName?: string | null;
    gstin?: string | null;
  };

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "No customer profile" }, { status: 400 });
  }

  const userData: { name?: string | null; phone?: string | null } = {};
  if (body.name !== undefined) userData.name = body.name;
  if (body.phone !== undefined) userData.phone = body.phone;

  const profData: { companyName?: string | null; gstin?: string | null } = {};
  if (body.companyName !== undefined) profData.companyName = body.companyName;
  if (body.gstin !== undefined) profData.gstin = body.gstin;

  if (Object.keys(userData).length) {
    await prisma.user.update({ where: { id: session.user.id }, data: userData });
  }
  if (Object.keys(profData).length) {
    await prisma.customerProfile.update({ where: { id: profile.id }, data: profData });
  }

  return NextResponse.json({ ok: true });
}
