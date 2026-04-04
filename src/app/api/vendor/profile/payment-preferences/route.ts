import { MIN_TOKEN_PERCENT_OPTIONS, normalizePaymentMethodIds } from "@/constants/payment-methods";
import { getVendorContext } from "@/lib/vendor-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const ctx = await getVendorContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    acceptedPaymentMethods?: string[];
    requiresFullAdvance?: boolean;
    minOrderForRTGS?: number | null;
    minTokenPercentage?: number;
    acceptsTokenPayment?: boolean;
  };

  const methods = normalizePaymentMethodIds(Array.isArray(body.acceptedPaymentMethods) ? body.acceptedPaymentMethods : []);
  if (methods.length === 0) {
    return NextResponse.json({ error: "Select at least one payment method" }, { status: 400 });
  }

  const minTok = Number(body.minTokenPercentage);
  if (!MIN_TOKEN_PERCENT_OPTIONS.includes(minTok as (typeof MIN_TOKEN_PERCENT_OPTIONS)[number])) {
    return NextResponse.json({ error: "Invalid minimum token %" }, { status: 400 });
  }

  const rtgs = body.minOrderForRTGS;
  if (rtgs != null && (typeof rtgs !== "number" || rtgs < 0 || !Number.isFinite(rtgs))) {
    return NextResponse.json({ error: "Invalid NEFT/RTGS threshold" }, { status: 400 });
  }

  const needsRtgs = rtgs != null && rtgs > 0;
  if (needsRtgs && !methods.includes("NEFT_RTGS")) {
    return NextResponse.json(
      { error: "Enable NEFT/RTGS when you require it above a threshold" },
      { status: 400 },
    );
  }

  const requiresFull = body.requiresFullAdvance === true;
  const acceptsToken = body.acceptsTokenPayment !== false;

  if (requiresFull && acceptsToken && minTok < 100) {
    /* allow — token section hidden in UI when full advance; still save acceptsToken false from client */
  }

  await prisma.vendorProfile.update({
    where: { id: ctx.vendorId },
    data: {
      acceptedPaymentMethods: methods as string[],
      requiresFullAdvance: requiresFull,
      minOrderForRTGS: rtgs == null || rtgs === 0 ? null : rtgs,
      minTokenPercentage: minTok,
      acceptsTokenPayment: requiresFull ? false : acceptsToken,
    },
  });

  return NextResponse.json({ ok: true });
}
