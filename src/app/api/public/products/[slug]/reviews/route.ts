import { GRADE_CONFIG } from "@/constants/grading";
import type { ProductCondition } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function gradeLabel(condition: ProductCondition) {
  return GRADE_CONFIG[condition]?.label ?? condition;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = 5;
  const skip = (page - 1) * pageSize;

  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const where = {
    type: "CUSTOMER_EXPERIENCE" as const,
    isPublic: true,
    adminFlagged: false,
    order: {
      items: { some: { listing: { productId: product.id } } },
    },
  };

  const [total, rows, agg, grouped] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        order: {
          include: {
            items: {
              where: { listing: { productId: product.id } },
              take: 1,
              include: { listing: { select: { condition: true } } },
            },
          },
        },
      },
    }),
    prisma.review.aggregate({ where, _avg: { rating: true }, _count: { _all: true } }),
    prisma.review.groupBy({ by: ["rating"], where, _count: { _all: true } }),
  ]);

  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
  for (const g of grouped) {
    dist[g.rating] = g._count._all;
  }
  const n = agg._count._all;
  const avg = agg._avg.rating ?? 0;

  const reviews = rows.map((r) => {
    const cond = r.order.items[0]?.listing.condition ?? "BRAND_NEW";
    return {
      rating: r.rating,
      comment: r.comment,
      tags: r.tags,
      grade: gradeLabel(cond),
      createdAt: r.createdAt.toISOString(),
      attribution: "Verified B2B Buyer",
    };
  });

  return NextResponse.json({
    page,
    pageSize,
    total,
    hasMore: skip + reviews.length < total,
    aggregate: {
      avg: Math.round(avg * 10) / 10,
      count: n,
      distribution: dist,
    },
    reviews,
  });
}
