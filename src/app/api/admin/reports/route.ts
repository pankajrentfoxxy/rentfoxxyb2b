import { getAdminUserId } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function range(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const to = sp.get("to") ? new Date(sp.get("to")!) : new Date();
  to.setHours(23, 59, 59, 999);
  const from = sp.get("from") ? new Date(sp.get("from")!) : new Date(to.getTime());
  if (!sp.get("from")) {
    from.setUTCDate(from.getUTCDate() - 30);
  }
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

export async function GET(req: NextRequest) {
  const adminId = await getAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const type = (req.nextUrl.searchParams.get("type") ?? "sales").toLowerCase();
  const { from, to } = range(req);

  if (type === "sales") {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: { notIn: ["PAYMENT_PENDING", "CANCELLED"] },
      },
      select: { totalAmount: true, items: { select: { subtotal: true, listing: { select: { product: { select: { categoryId: true } } } } } } },
    });
    const gmv = orders.reduce((s, o) => s + o.totalAmount, 0);
    const count = orders.length;
    const aov = count ? gmv / count : 0;
    const byCat = new Map<string, number>();
    for (const o of orders) {
      for (const i of o.items) {
        const cid = i.listing.product.categoryId;
        byCat.set(cid, (byCat.get(cid) ?? 0) + i.subtotal);
      }
    }
    const categories = await prisma.category.findMany({
      where: { id: { in: Array.from(byCat.keys()) } },
      select: { id: true, name: true },
    });
    const categoryRows = categories.map((c) => ({ name: c.name, amount: byCat.get(c.id) ?? 0 }));
    return NextResponse.json({ gmv, orders: count, aov, categoryRows });
  }

  if (type === "vendors") {
    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: from, lte: to },
          status: { notIn: ["PAYMENT_PENDING", "CANCELLED"] },
        },
      },
      select: {
        subtotal: true,
        listing: { select: { vendorId: true, vendor: { select: { companyName: true } } } },
        order: { select: { id: true } },
      },
    });
    const byVendor = new Map<
      string,
      { name: string; revenue: number; orders: Set<string>; commission: number }
    >();
    for (const row of items) {
      const id = row.listing.vendorId;
      const name = row.listing.vendor.companyName;
      let v = byVendor.get(id);
      if (!v) {
        v = { name, revenue: 0, orders: new Set(), commission: 0 };
        byVendor.set(id, v);
      }
      v.revenue += row.subtotal;
      v.orders.add(row.order.id);
    }
    const vendors = await prisma.vendorProfile.findMany({
      where: { id: { in: Array.from(byVendor.keys()) } },
      select: { id: true, commissionRate: true },
    });
    const rateMap = new Map(vendors.map((v) => [v.id, v.commissionRate]));
    const rows = Array.from(byVendor.entries()).map(([id, v]) => {
      const rate = rateMap.get(id) ?? 8;
      const commission = (v.revenue * rate) / 100;
      return {
        vendorId: id,
        companyName: v.name,
        orderCount: v.orders.size,
        revenue: v.revenue,
        commissionRate: rate,
        commission,
      };
    });
    return NextResponse.json({ rows });
  }

  if (type === "bids") {
    const bids = await prisma.bid.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: {
        listing: { select: { unitPrice: true, product: { select: { id: true, name: true } } } },
      },
    });
    const total = bids.length;
    const paid = bids.filter((b) => b.status === "PAID").length;
    const conversion = total ? (paid / total) * 100 : 0;
    let discountSum = 0;
    let discountN = 0;
    for (const b of bids) {
      const list = b.listing.unitPrice;
      if (list > 0 && b.bidPricePerUnit > 0) {
        discountSum += ((list - b.bidPricePerUnit) / list) * 100;
        discountN++;
      }
    }
    const avgDiscount = discountN ? discountSum / discountN : 0;
    const byProduct = new Map<string, { name: string; bids: number }>();
    for (const b of bids) {
      const pid = b.listing.product.id;
      const cur = byProduct.get(pid) ?? { name: b.listing.product.name, bids: 0 };
      cur.bids += 1;
      byProduct.set(pid, cur);
    }
    return NextResponse.json({
      totalBids: total,
      conversionPct: Math.round(conversion * 10) / 10,
      avgDiscountPct: Math.round(avgDiscount * 10) / 10,
      byProduct: Array.from(byProduct.values())
        .sort((a, b) => b.bids - a.bids)
        .slice(0, 15),
    });
  }

  if (type === "customers") {
    const profiles = await prisma.customerProfile.findMany({
      include: {
        user: { select: { createdAt: true, email: true, name: true } },
        orders: {
          where: { status: { notIn: ["PAYMENT_PENDING", "CANCELLED"] } },
          select: { totalAmount: true, createdAt: true },
        },
      },
    });
    const { from: f, to: t } = range(req);
    const newCustomers = profiles.filter((p) => p.user.createdAt >= f && p.user.createdAt <= t).length;
    const spenders = profiles
      .map((p) => ({
        id: p.id,
        email: p.user.email,
        name: p.user.name,
        companyName: p.companyName,
        orderCount: p.orders.length,
        totalSpend: p.orders.reduce((s, o) => s + o.totalAmount, 0),
        joined: p.user.createdAt.toISOString(),
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend);
    const repeat = spenders.filter((c) => c.orderCount > 1).length;
    return NextResponse.json({ newCustomers, repeatCustomers: repeat, topSpenders: spenders.slice(0, 25) });
  }

  return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
}
