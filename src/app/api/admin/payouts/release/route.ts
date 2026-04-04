import { PayoutReleased } from "@/emails/PayoutReleased";
import { getAdminUserId } from "@/lib/admin-auth";
import { sendEmail } from "@/lib/email";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as React from "react";

const RELEASE_ORDER_STATUSES = new Set([
  "DELIVERY_CONFIRMED",
  "DELIVERED",
  "PAYOUT_PENDING",
]);

export async function POST(req: NextRequest) {
  const adminId = await getAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { payoutIds?: string[]; utrNumber?: string };
  const ids = Array.isArray(body.payoutIds) ? body.payoutIds : [];
  const utr = (body.utrNumber ?? "").trim();
  if (ids.length === 0 || !utr) {
    return NextResponse.json({ error: "payoutIds and utrNumber required" }, { status: 400 });
  }

  const released: string[] = [];

  for (const id of ids) {
    const payout = await prisma.payout.findUnique({
      where: { id },
      include: {
        order: true,
        vendor: { include: { user: { select: { id: true, email: true } } } },
      },
    });
    if (!payout) continue;
    if (payout.status !== "PENDING" && payout.status !== "PROCESSING") continue;
    if (!RELEASE_ORDER_STATUSES.has(payout.order.status)) {
      return NextResponse.json(
        { error: `Order ${payout.order.orderNumber} is not eligible for payout release (${payout.order.status})` },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.payout.update({
        where: { id },
        data: {
          status: "RELEASED",
          utrNumber: utr,
          releasedAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: payout.orderId },
        data: { status: "PAYOUT_RELEASED" },
      }),
    ]);

    await createNotification({
      userId: payout.vendor.user.id,
      type: NOTIFICATION_TYPES.PAYOUT_RELEASED,
      title: "Payout released",
      message: `₹${payout.netAmount.toLocaleString("en-IN")} for order ${payout.order.orderNumber} — UTR ${utr}`,
      link: "/vendor/payouts",
    });

    const vEmail = payout.vendor.user.email;
    if (vEmail) {
      const sym = "₹";
      void sendEmail({
        to: vEmail,
        subject: `Payout released — ${payout.order.orderNumber}`,
        react: React.createElement(PayoutReleased, {
          vendorName: payout.vendor.companyName,
          amountGross: `${sym}${payout.grossAmount.toLocaleString("en-IN")}`,
          orderNumber: payout.order.orderNumber,
          utrNumber: utr,
          commissionRate: `${payout.commissionRate}%`,
          commissionAmount: `${sym}${payout.commissionAmount.toLocaleString("en-IN")}`,
          netAmount: `${sym}${payout.netAmount.toLocaleString("en-IN")}`,
        }),
      });
    }

    released.push(id);
  }

  return NextResponse.json({ ok: true, released });
}
