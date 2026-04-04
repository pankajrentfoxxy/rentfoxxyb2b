import { getAdminUserId } from "@/lib/admin-auth";
import { createCreditNoteForOrder } from "@/lib/invoice-generator";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const adminId = await getAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  try {
    const result = await createCreditNoteForOrder(id);
    if (!result) {
      return NextResponse.json({ error: "Could not create credit note" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, invoiceId: result.invoiceId, invoiceNumber: result.invoiceNumber });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
