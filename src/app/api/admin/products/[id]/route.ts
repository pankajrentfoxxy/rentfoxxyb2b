import { getAdminUserId } from "@/lib/admin-auth";
import { normalizeProductImages } from "@/lib/image-url";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const adminId = await getAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await req.json()) as {
    name?: string;
    description?: string;
    specs?: unknown;
    images?: string[];
    hsnCode?: string;
    isFeatured?: boolean;
    isActive?: boolean;
    slug?: string;
    brand?: string;
  };

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Prisma.ProductUpdateInput = {};

  if (body.name?.trim()) data.name = body.name.trim();
  if (typeof body.description === "string") data.description = body.description;
  if (body.specs !== undefined) {
    try {
      JSON.stringify(body.specs);
      data.specs = body.specs as Prisma.InputJsonValue;
    } catch {
      return NextResponse.json({ error: "specs must be JSON-serializable" }, { status: 400 });
    }
  }
  if (Array.isArray(body.images)) data.images = normalizeProductImages(body.images as string[]);
  if (typeof body.hsnCode === "string") data.hsnCode = body.hsnCode.trim() || product.hsnCode;
  if (typeof body.isFeatured === "boolean") data.isFeatured = body.isFeatured;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.brand === "string" && body.brand.trim()) data.brand = body.brand.trim();
  if (body.slug?.trim()) {
    const clash = await prisma.product.findFirst({ where: { slug: body.slug.trim(), NOT: { id } } });
    if (clash) return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
    data.slug = body.slug.trim();
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields" }, { status: 400 });
  }

  await prisma.product.update({ where: { id }, data });

  return NextResponse.json({ ok: true });
}
