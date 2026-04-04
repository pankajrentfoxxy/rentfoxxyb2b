import { getAdminUserId } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import type { OrderStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function csvEscape(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const adminId = await getAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const vendorId = sp.get("vendorId") ?? undefined;
  const status = sp.get("status") as OrderStatus | null;
  const dateFrom = sp.get("dateFrom");
  const dateTo = sp.get("dateTo");
  const minAmount = sp.get("minAmount");
  const maxAmount = sp.get("maxAmount");
  const bidOnly = sp.get("bidOnly") === "1";

  const where: Prisma.OrderWhereInput = {};

  if (status) where.status = status;

  const created: Prisma.DateTimeFilter = {};
  if (dateFrom) created.gte = new Date(dateFrom);
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    created.lte = end;
  }
  if (Object.keys(created).length) where.createdAt = created;

  const amt: Prisma.FloatFilter = {};
  if (minAmount && Number.isFinite(Number(minAmount))) amt.gte = Number(minAmount);
  if (maxAmount && Number.isFinite(Number(maxAmount))) amt.lte = Number(maxAmount);
  if (Object.keys(amt).length) where.totalAmount = amt;

  if (bidOnly) where.bidId = { not: null };
  if (vendorId) where.items = { some: { listing: { vendorId } } };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: {
      customer: { include: { user: { select: { email: true, name: true } } } },
      items: { include: { listing: { include: { vendor: true, product: { select: { name: true } } } } } },
    },
  });

  const headers = ["orderNumber", "createdAt", "status", "customerEmail", "vendorSummary", "itemCount", "totalAmount", "isBidOrder"];
  const lines = [headers.join(",")];

  for (const o of orders) {
    const vendors = Array.from(new Set(o.items.map((i) => i.listing.vendor.companyName)));
    const vendorSummary = vendors.length > 2 ? `${vendors.length} vendors` : vendors.join(" + ");
    lines.push(
      [
        csvEscape(o.orderNumber),
        csvEscape(o.createdAt.toISOString()),
        csvEscape(o.status),
        csvEscape(o.customer.user.email),
        csvEscape(vendorSummary),
        String(o.items.length),
        String(o.totalAmount),
        o.bidId ? "yes" : "no",
      ].join(","),
    );
  }

  const csv = lines.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-export.csv"`,
    },
  });
}
