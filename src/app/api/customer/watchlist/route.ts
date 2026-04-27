import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STOREFRONT_LISTING_WHERE } from "@/lib/public-api";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 400 });

  const watches = await prisma.priceWatch.findMany({
    where: { customerId: profile.id, isActive: true },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          brand: true,
          listings: {
            where: STOREFRONT_LISTING_WHERE,
            orderBy: { unitPrice: "asc" },
            take: 1,
            select: { unitPrice: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = watches.map((w) => {
    const minPrice = w.product.listings[0]?.unitPrice ?? null;
    return {
      id: w.id,
      productId: w.productId,
      name: w.product.name,
      slug: w.product.slug,
      brand: w.product.brand,
      targetPrice: w.targetPrice,
      currentMinPrice: minPrice,
      createdAt: w.createdAt.toISOString(),
      reached: minPrice != null && minPrice <= w.targetPrice,
    };
  });

  return NextResponse.json({ watches: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { productId?: string; targetPrice?: number };
  const productId = body.productId?.trim();
  const targetPrice = Number(body.targetPrice);
  if (!productId || !Number.isFinite(targetPrice) || targetPrice <= 0) {
    return NextResponse.json({ error: "productId and targetPrice required" }, { status: 400 });
  }

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 400 });

  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  await prisma.priceWatch.upsert({
    where: {
      customerId_productId: { customerId: profile.id, productId },
    },
    create: {
      customerId: profile.id,
      productId,
      targetPrice,
      isActive: true,
    },
    update: {
      targetPrice,
      isActive: true,
      lastAlertedAt: null,
    },
  });

  return NextResponse.json({ success: true });
}
