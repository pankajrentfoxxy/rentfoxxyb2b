import { getAdminUserId } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { InspectorType, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminUserId();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const inspectors = await prisma.inspector.findMany({
    include: { user: { select: { email: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ inspectors });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUserId();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
    type?: InspectorType;
    cityZones?: string[];
  };

  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const name = body.name?.trim();
  if (!email || !password || !name) {
    return NextResponse.json({ error: "email, password, name required" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email already used" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const type = body.type === "OUTSOURCED" ? "OUTSOURCED" : "INHOUSE";
  const cityZones = Array.isArray(body.cityZones) ? body.cityZones.map((z) => String(z).trim()).filter(Boolean) : [];

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: Role.INSPECTOR,
        name,
        phone: body.phone?.trim() || null,
        isVerified: true,
      },
    });
    await tx.inspector.create({
      data: {
        userId: user.id,
        type,
        name,
        phone: body.phone?.trim() || null,
        cityZones,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
