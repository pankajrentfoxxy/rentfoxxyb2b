import { getAdminUserId } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function maskSecret(s: string) {
  if (!s || s.length < 4) return s ? "••••" : "";
  return `••••••••${s.slice(-4)}`;
}

export async function GET() {
  const adminId = await getAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const s = await prisma.platformSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  return NextResponse.json({
    settings: {
      companyName: s.companyName,
      companyPhone: s.companyPhone,
      companyEmail: s.companyEmail,
      address: s.address,
      gstin: s.gstin,
      pan: s.pan,
      defaultCommission: s.defaultCommission,
      invoicePrefix: s.invoicePrefix,
      proformaPrefix: s.proformaPrefix,
      creditNotePrefix: s.creditNotePrefix,
      companyState: s.companyState,
      orderPrefix: s.orderPrefix,
      razorpayKeyId: s.razorpayKeyId,
      razorpayKeySecretMasked: maskSecret(s.razorpayKeySecret),
      webhookPublicUrl: s.webhookPublicUrl,
    },
  });
}

export async function PUT(req: NextRequest) {
  const adminId = await getAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;

  const data: Prisma.PlatformSettingsUpdateInput = {};

  const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : undefined);

  if (str("companyName")) data.companyName = str("companyName");
  if (str("companyPhone") !== undefined) data.companyPhone = str("companyPhone") ?? "";
  if (str("companyEmail") !== undefined) data.companyEmail = str("companyEmail") ?? "";
  if (str("address") !== undefined) data.address = str("address") ?? "";
  if (str("gstin") !== undefined) data.gstin = str("gstin") ?? "";
  if (str("pan") !== undefined) data.pan = str("pan") ?? "";
  if (typeof body.defaultCommission === "number" && Number.isFinite(body.defaultCommission)) {
    data.defaultCommission = Math.min(100, Math.max(0, body.defaultCommission));
  }
  if (str("invoicePrefix")) data.invoicePrefix = str("invoicePrefix");
  if (str("proformaPrefix")) data.proformaPrefix = str("proformaPrefix");
  if (str("creditNotePrefix")) data.creditNotePrefix = str("creditNotePrefix");
  if (str("companyState") !== undefined) data.companyState = str("companyState") ?? "Karnataka";
  if (str("orderPrefix")) data.orderPrefix = str("orderPrefix");
  if (str("razorpayKeyId") !== undefined) data.razorpayKeyId = str("razorpayKeyId") ?? "";
  const newSecret = str("razorpayKeySecret");
  if (newSecret) data.razorpayKeySecret = newSecret;
  if (str("webhookPublicUrl") !== undefined) data.webhookPublicUrl = str("webhookPublicUrl") ?? "";

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await prisma.platformSettings.update({
    where: { id: "singleton" },
    data,
  });

  return NextResponse.json({ ok: true });
}
