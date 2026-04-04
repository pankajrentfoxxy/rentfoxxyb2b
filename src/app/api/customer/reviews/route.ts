import { auth } from "@/lib/auth";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { isWithinDaysAfterDelivery, orderDeliveryAnchor } from "@/lib/order-delivery";
import { prisma } from "@/lib/prisma";
import { normalizeCustomerReviewTags } from "@/lib/review-tags";
import { primaryVendorProfileIdFromOrderItems, recomputeVendorReviewStats } from "@/lib/review-ratings";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    orderId?: string;
    rating?: number;
    comment?: string | null;
    tags?: string[];
  };

  const orderId = body.orderId;
  const rating = Number(body.rating);
  if (!orderId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "No profile" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: profile.id },
    include: {
      items: { include: { listing: true } },
      shipment: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "DELIVERED" && order.status !== "DELIVERY_CONFIRMED") {
    return NextResponse.json({ error: "Order is not delivered yet" }, { status: 400 });
  }

  const anchor = orderDeliveryAnchor(order.status, order.shipment?.deliveredAt, order.updatedAt);
  if (!isWithinDaysAfterDelivery(anchor, 7)) {
    return NextResponse.json(
      { error: "Review window closed (reviews allowed within 7 days of delivery)" },
      { status: 400 },
    );
  }

  const vendorId = primaryVendorProfileIdFromOrderItems(order.items);
  if (!vendorId) {
    return NextResponse.json({ error: "No supplier on record for this order" }, { status: 400 });
  }

  const dup = await prisma.review.findUnique({
    where: {
      orderId_reviewerId_type: {
        orderId: order.id,
        reviewerId: session.user.id,
        type: "CUSTOMER_EXPERIENCE",
      },
    },
  });
  if (dup) {
    return NextResponse.json({ error: "You already reviewed this order" }, { status: 409 });
  }

  const tags = normalizeCustomerReviewTags(rating, Array.isArray(body.tags) ? body.tags : []);
  const comment =
    typeof body.comment === "string" && body.comment.trim().length > 0
      ? body.comment.trim().slice(0, 500)
      : null;

  const review = await prisma.review.create({
    data: {
      type: "CUSTOMER_EXPERIENCE",
      orderId: order.id,
      reviewerId: session.user.id,
      subjectId: vendorId,
      rating,
      comment,
      tags,
      isPublic: true,
    },
  });

  await recomputeVendorReviewStats(vendorId);

  await createNotification({
    userId: session.user.id,
    type: NOTIFICATION_TYPES.REVIEW_THANKS,
    title: "Thanks for your feedback",
    message: "Your review helps other B2B buyers choose with confidence.",
    link: `/customer/orders/${order.id}`,
  });

  return NextResponse.json({ success: true, review: { id: review.id } });
}
