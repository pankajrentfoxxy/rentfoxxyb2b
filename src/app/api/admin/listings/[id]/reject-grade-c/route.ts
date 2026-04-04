import { getAdminUserId } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Reject pending Grade C listing — stays off storefront. */
export async function POST(_req: NextRequest, route: { params: Promise<{ id: string }> }) {
  const adminId = await getAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await route.params;
  const listing = await prisma.productListing.findUnique({
    where: { id },
  });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!listing.requiresAdminApproval) {
    return NextResponse.json({ error: "Listing does not require approval" }, { status: 400 });
  }

  await prisma.productListing.update({
    where: { id },
    data: { requiresAdminApproval: false, isActive: false },
  });

  return NextResponse.json({ ok: true });
}
