import { auth } from "@/lib/auth";
import { getOrRenderInvoicePdf } from "@/lib/invoice-generator";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "No profile" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      OR: [{ order: { customerId: profile.id } }, { bid: { customerId: profile.id } }],
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.fileUrl?.startsWith("http://") || invoice.fileUrl?.startsWith("https://")) {
    return NextResponse.redirect(invoice.fileUrl);
  }

  const pdf = await getOrRenderInvoicePdf(invoice.invoiceNumber);
  if (!pdf) {
    return NextResponse.json({ error: "PDF not available" }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
