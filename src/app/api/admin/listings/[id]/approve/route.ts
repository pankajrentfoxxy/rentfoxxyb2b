import { getAdminUserId } from "@/lib/admin-auth";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Approve Grade C (or other) listing pending admin review — makes listing live. */
export async function POST(_req: NextRequest, route: { params: Promise<{ id: string }> }) {
  const adminId = await getAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await route.params;
  const listing = await prisma.productListing.findUnique({
    where: { id },
    include: { vendor: true, product: { select: { name: true } } },
  });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!listing.requiresAdminApproval) {
    return NextResponse.json({ error: "Listing does not require approval" }, { status: 400 });
  }

  await prisma.productListing.update({
    where: { id },
    data: { requiresAdminApproval: false, isActive: true },
  });

  await createNotification({
    userId: listing.vendor.userId,
    type: NOTIFICATION_TYPES.LISTING_GRADE_C_APPROVED,
    title: "Listing approved",
    message: `Your ${listing.product.name} listing (${listing.sku}) is now live on Rentfoxxy.`,
    link: `/vendor/products/${listing.id}/edit`,
  });

  return NextResponse.json({ ok: true });
}
