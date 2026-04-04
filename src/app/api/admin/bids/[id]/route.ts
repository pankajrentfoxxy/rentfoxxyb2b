import { getAppBaseUrl } from "@/lib/app-url";
import { BidApproved } from "@/emails/BidApproved";
import { BidRejected } from "@/emails/BidRejected";
import { getAdminUserId } from "@/lib/admin-auth";
import { sendEmail } from "@/lib/email";
import { createProformaInvoiceForBid } from "@/lib/invoice-generator";
import { gstBreakdown } from "@/lib/gst";
import { NOTIFICATION_TYPES } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as React from "react";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const adminId = await getAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await req.json()) as {
    action?: "force_approve" | "force_reject" | "extend";
    hours?: number;
  };

  const bid = await prisma.bid.findUnique({
    where: { id },
    include: {
      customer: { select: { userId: true, user: { select: { email: true, name: true } } } },
      listing: { include: { product: true } },
    },
  });
  if (!bid) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.action === "force_approve") {
    const hours = Math.min(168, Math.max(1, Math.floor(Number(body.hours) || 48)));
    const expiresAt = new Date(Date.now() + hours * 3600 * 1000);
    await prisma.$transaction([
      prisma.bid.update({
        where: { id },
        data: { status: "APPROVED", expiresAt, counterPrice: null },
      }),
      prisma.notification.create({
        data: {
          userId: bid.customer.userId,
          type: NOTIFICATION_TYPES.BID_APPROVED,
          title: "Bid approved (admin)",
          message: `Your bid was approved by the platform team. Pay within ${hours}h.`,
          link: `/customer/bids/${id}`,
        },
      }),
    ]);
    void createProformaInvoiceForBid(id).catch(() => undefined);
    const aEmail = bid.customer.user.email;
    if (aEmail) {
      const base = getAppBaseUrl();
      const gst = gstBreakdown(bid.totalBidAmount);
      const sym = "₹";
      const savePerUnit = bid.listing.unitPrice - bid.bidPricePerUnit;
      const savingsPerUnit =
        savePerUnit > 0.01 ? `${sym}${savePerUnit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : null;
      void sendEmail({
        to: aEmail,
        subject: "Your price request was approved",
        react: React.createElement(BidApproved, {
          customerName: bid.customer.user.name ?? aEmail,
          productName: bid.listing.product.name,
          quantity: bid.quantity,
          approvedPricePerUnit: `${sym}${bid.bidPricePerUnit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
          totalAmount: `${sym}${gst.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
          savingsPerUnit,
          expiresAt: expiresAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
          paymentLink: `${base}/customer/bids/${id}`,
        }),
      });
    }
    return NextResponse.json({ ok: true, status: "APPROVED" });
  }

  if (body.action === "force_reject") {
    await prisma.$transaction([
      prisma.bid.update({ where: { id }, data: { status: "REJECTED" } }),
      prisma.notification.create({
        data: {
          userId: bid.customer.userId,
          type: NOTIFICATION_TYPES.BID_REJECTED,
          title: "Bid closed",
          message: "The platform marked this bid as closed.",
          link: `/customer/bids/${id}`,
        },
      }),
    ]);
    const rEmail = bid.customer.user.email;
    if (rEmail) {
      const base = getAppBaseUrl();
      void sendEmail({
        to: rEmail,
        subject: "Update on your price request",
        react: React.createElement(BidRejected, {
          customerName: bid.customer.user.name ?? rEmail,
          productName: bid.listing.product.name,
          browseUrl: `${base}/products/${bid.listing.product.slug}`,
        }),
      });
    }
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  if (body.action === "extend") {
    const hours = Math.min(720, Math.max(1, Math.floor(Number(body.hours) || 24)));
    const base = bid.expiresAt && bid.expiresAt > new Date() ? bid.expiresAt : new Date();
    const expiresAt = new Date(base.getTime() + hours * 3600 * 1000);
    await prisma.bid.update({
      where: { id },
      data: { expiresAt },
    });
    await prisma.notification.create({
      data: {
        userId: bid.customer.userId,
        type: NOTIFICATION_TYPES.BID_EXTENDED,
        title: "Bid window extended",
        message: `You have more time to complete payment (admin extension, +${hours}h).`,
        link: `/customer/bids/${id}`,
      },
    });
    return NextResponse.json({ ok: true, expiresAt: expiresAt.toISOString() });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
