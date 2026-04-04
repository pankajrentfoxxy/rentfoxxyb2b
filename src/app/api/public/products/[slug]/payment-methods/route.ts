import { PAYMENT_METHOD_CONFIG, type PaymentMethodId } from "@/constants/payment-methods";
import { STOREFRONT_LISTING_WHERE } from "@/lib/public-api";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;

  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      listings: {
        where: STOREFRONT_LISTING_WHERE,
        select: {
          vendor: {
            select: {
              acceptedPaymentMethods: true,
              acceptsTokenPayment: true,
              minTokenPercentage: true,
            },
          },
        },
      },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const union = new Set<string>();
  let tokenAvailable = false;

  for (const l of product.listings) {
    for (const m of l.vendor.acceptedPaymentMethods) {
      union.add(m);
    }
    if (
      l.vendor.acceptsTokenPayment &&
      l.vendor.minTokenPercentage < 100 &&
      l.vendor.acceptedPaymentMethods.includes("TOKEN_PAYMENT")
    ) {
      tokenAvailable = true;
    }
  }

  const availableMethods = Array.from(union).filter((m): m is PaymentMethodId =>
    Object.prototype.hasOwnProperty.call(PAYMENT_METHOD_CONFIG, m),
  );

  return NextResponse.json({
    availableMethods,
    tokenAvailable,
  });
}
