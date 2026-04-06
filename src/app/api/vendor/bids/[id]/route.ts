import { getAppBaseUrl } from "@/lib/app-url";
import { BidCounterOffer } from "@/emails/BidCounterOffer";
import { BidRejected } from "@/emails/BidRejected";
import { createProformaInvoiceForBid } from "@/lib/invoice-generator";
import { sendEmail } from "@/lib/email";
import { notifyBidApproved } from "@/lib/notify";
import { NOTIFICATION_TYPES } from "@/lib/notifications";
import { parsePaymentOption } from "@/constants/payment-options";
import { getVendorContext } from "@/lib/vendor-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as React from "react";

export const dynamic = "force-dynamic";

type Body = {
  action?: "approve" | "reject" | "counter";
  expiresInHours?: number;
  rejectReason?: string;
  counterPrice?: number;
};

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const vctx = await getVendorContext();
  if (!vctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as Body;
  const action = body.action;

  if (!action || !["approve", "reject", "counter"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const bid = await prisma.bid.findFirst({
    where: { id, listing: { vendorId: vctx.vendorId } },
    include: {
      listing: { include: { product: true } },
      customer: { select: { id: true, userId: true, user: { select: { email: true, name: true } } } },
    },
  });

  if (!bid) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (bid.status !== "PENDING" && bid.status !== "COUNTER_OFFERED") {
    return NextResponse.json({ error: "Bid is not open for this action" }, { status: 400 });
  }

  if (action === "approve") {
    const payOpt = parsePaymentOption(bid.paymentOption);
    const hoursRaw = payOpt !== "FULL" ? 24 : body.expiresInHours ?? 48;
    const hours = Math.min(168, Math.max(1, Math.floor(Number(hoursRaw) || 48)));
    const expiresAt = new Date(Date.now() + hours * 3600 * 1000);

    await prisma.bid.update({
      where: { id },
      data: {
        status: "APPROVED",
        expiresAt,
        counterPrice: null,
      },
    });

    void createProformaInvoiceForBid(id).catch(() => undefined);

    void notifyBidApproved({
      customerEmail: bid.customer.user.email ?? "",
      customerName: bid.customer.user.name ?? bid.customer.user.email ?? "Customer",
      customerUserId: bid.customer.userId,
      bidId: id,
      productName: bid.listing.product.name,
      quantity: bid.quantity,
      bidPricePerUnit: bid.bidPricePerUnit,
      totalBidAmount: bid.totalBidAmount,
      unitPrice: bid.listing.unitPrice,
      expiresAt,
    });

    return NextResponse.json({ ok: true, status: "APPROVED", expiresAt: expiresAt.toISOString() });
  }

  if (action === "reject") {
    await prisma.$transaction([
      prisma.bid.update({
        where: { id },
        data: {
          status: "REJECTED",
          vendorNote: body.rejectReason?.slice(0, 2000) ?? null,
        },
      }),
      prisma.notification.create({
        data: {
          userId: bid.customer.userId,
          type: NOTIFICATION_TYPES.BID_REJECTED,
          title: "Bid declined",
          message: "The vendor declined your bid. You can place a new bid if the listing is still available.",
          link: `/customer/bids/${id}`,
        },
      }),
    ]);

    const rejEmail = bid.customer.user.email;
    if (rejEmail) {
      const base = getAppBaseUrl();
      void sendEmail({
        to: rejEmail,
        subject: "Update on your price request",
        react: React.createElement(BidRejected, {
          customerName: bid.customer.user.name ?? rejEmail,
          productName: bid.listing.product.name,
          browseUrl: `${base}/products/${bid.listing.product.slug}`,
        }),
      });
    }

    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  const counter = Number(body.counterPrice);
  if (!Number.isFinite(counter) || counter <= 0) {
    return NextResponse.json({ error: "counterPrice required" }, { status: 400 });
  }
  if (counter < bid.listing.minBidPrice) {
    return NextResponse.json(
      { error: `Counter must be at least ₹${bid.listing.minBidPrice}` },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.bid.update({
      where: { id },
      data: {
        status: "COUNTER_OFFERED",
        counterPrice: counter,
      },
    }),
    prisma.notification.create({
      data: {
        userId: bid.customer.userId,
        type: NOTIFICATION_TYPES.BID_COUNTER,
        title: "Counter-offer received",
        message: `The vendor proposed ₹${counter.toLocaleString("en-IN")} per unit. Review and accept or decline.`,
        link: `/customer/bids/${id}`,
      },
    }),
  ]);

  const cEmail = bid.customer.user.email;
  if (cEmail) {
    const base = getAppBaseUrl();
    void sendEmail({
      to: cEmail,
      subject: "Counter-offer on your bid",
      react: React.createElement(BidCounterOffer, {
        customerName: bid.customer.user.name ?? cEmail,
        productName: bid.listing.product.name,
        counterPricePerUnit: `₹${counter.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        bidUrl: `${base}/customer/bids/${id}`,
      }),
    });
  }

  return NextResponse.json({ ok: true, status: "COUNTER_OFFERED", counterPrice: counter });
}
