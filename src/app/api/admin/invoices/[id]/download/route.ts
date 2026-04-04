import { getAdminUserId } from "@/lib/admin-auth";
import { getOrRenderInvoicePdf } from "@/lib/invoice-generator";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const adminId = await getAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (invoice.fileUrl?.startsWith("http://") || invoice.fileUrl?.startsWith("https://")) {
    return NextResponse.redirect(invoice.fileUrl);
  }

  const pdf = await getOrRenderInvoicePdf(invoice.invoiceNumber);
  if (!pdf) return NextResponse.json({ error: "PDF not available" }, { status: 500 });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
