import { PriceAlertEmail } from "@/emails/PriceAlertEmail";
import { sendEmail } from "@/lib/email";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { STOREFRONT_LISTING_WHERE } from "@/lib/public-api";
import { NextRequest, NextResponse } from "next/server";
import * as React from "react";

export const dynamic = "force-dynamic";

function authCron(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const watches = await prisma.priceWatch.findMany({
    where: { isActive: true },
    include: {
      product: {
        select: {
          name: true,
          slug: true,
          listings: {
            where: STOREFRONT_LISTING_WHERE,
            orderBy: { unitPrice: "asc" },
            take: 1,
            select: { unitPrice: true },
          },
        },
      },
      customer: { include: { user: { select: { id: true, email: true } } } },
    },
  });

  let alertsSent = 0;
  const now = new Date();
  for (const watch of watches) {
    const minPrice = watch.product.listings[0]?.unitPrice;
    if (minPrice == null) continue;
    if (minPrice > watch.targetPrice) continue;

    const last = watch.lastAlertedAt;
    if (last && now.getTime() - last.getTime() < 24 * 60 * 60 * 1000) continue;

    const email = watch.customer.user.email;
    if (process.env.RESEND_API_KEY && email) {
      await sendEmail({
        to: email,
        subject: `Price alert: ${watch.product.name} at ₹${minPrice.toLocaleString("en-IN")}`,
        react: React.createElement(PriceAlertEmail, {
          productName: watch.product.name,
          productSlug: watch.product.slug,
          currentPrice: minPrice,
          targetPrice: watch.targetPrice,
        }),
      });
    }

    await createNotification({
      userId: watch.customer.userId,
      type: NOTIFICATION_TYPES.PRICE_ALERT,
      title: "Price drop alert",
      message: `${watch.product.name} is now ₹${minPrice.toLocaleString("en-IN")}/unit — your target reached.`,
      link: `/products/${watch.product.slug}`,
    });

    await prisma.priceWatch.update({
      where: { id: watch.id },
      data: { lastAlertedAt: now },
    });
    alertsSent++;
  }

  return NextResponse.json({ alertsSent });
}
