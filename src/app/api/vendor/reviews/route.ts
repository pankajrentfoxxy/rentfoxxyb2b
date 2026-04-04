import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeVendorReviewTags } from "@/lib/review-tags";
import { recomputeCustomerReviewStats } from "@/lib/review-ratings";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "VENDOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!vendor) {
    return NextResponse.json({ error: "No vendor profile" }, { status: 400 });
  }

  const body = (await req.json()) as { orderId?: string; rating?: number; tags?: string[] };
  const orderId = body.orderId;
  const rating = Number(body.rating);
  if (!orderId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      items: { some: { listing: { vendorId: vendor.id } } },
    },
    include: { items: { include: { listing: true } } },
  });

  if (!order || order.items.length === 0) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const vendorIds = new Set(order.items.map((i) => i.listing.vendorId));
  if (vendorIds.size !== 1 || !vendorIds.has(vendor.id)) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const allowedStatus = [
    "DELIVERED",
    "DELIVERY_CONFIRMED",
    "PAYOUT_PENDING",
    "PAYOUT_RELEASED",
  ];
  if (!allowedStatus.includes(order.status)) {
    return NextResponse.json(
      { error: "Rate the buyer after the order is marked delivered" },
      { status: 400 },
    );
  }

  const dup = await prisma.review.findUnique({
    where: {
      orderId_reviewerId_type: {
        orderId: order.id,
        reviewerId: session.user.id,
        type: "VENDOR_CUSTOMER",
      },
    },
  });
  if (dup) {
    return NextResponse.json({ error: "You already rated this buyer for this order" }, { status: 409 });
  }

  const tags = normalizeVendorReviewTags(Array.isArray(body.tags) ? body.tags : []);

  await prisma.review.create({
    data: {
      type: "VENDOR_CUSTOMER",
      orderId: order.id,
      reviewerId: session.user.id,
      subjectId: order.customerId,
      rating,
      tags,
      isPublic: false,
      comment: null,
    },
  });

  await recomputeCustomerReviewStats(order.customerId);

  return NextResponse.json({ success: true });
}
