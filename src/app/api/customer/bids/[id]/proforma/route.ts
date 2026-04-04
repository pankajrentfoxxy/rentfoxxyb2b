import { auth } from "@/lib/auth";
import { createProformaInvoiceForBid } from "@/lib/invoice-generator";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Idempotent: ensures proforma PDF exists for an approved bid (customer). */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 400 });

  const { id } = await ctx.params;
  const bid = await prisma.bid.findFirst({
    where: { id, customerId: profile.id, status: "APPROVED" },
  });
  if (!bid) {
    return NextResponse.json({ error: "Bid not found or not approved" }, { status: 404 });
  }

  const result = await createProformaInvoiceForBid(id);
  if (!result) {
    return NextResponse.json({ error: "Could not generate proforma" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, invoiceId: result.invoiceId, invoiceNumber: result.invoiceNumber });
}
