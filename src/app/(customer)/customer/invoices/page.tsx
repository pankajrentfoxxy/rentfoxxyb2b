import { auth } from "@/lib/auth";
import { gstBreakdown } from "@/lib/gst";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CustomerInvoicesListClient, { type CustomerInvoiceRow } from "./CustomerInvoicesListClient";

export default async function CustomerInvoicesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/auth/login");

  const invoices = await prisma.invoice.findMany({
    where: {
      OR: [{ order: { customerId: profile.id } }, { bid: { customerId: profile.id } }],
    },
    orderBy: { issuedAt: "desc" },
    include: {
      order: { select: { orderNumber: true, id: true, totalAmount: true } },
      bid: { select: { id: true, totalBidAmount: true } },
    },
  });

  const initialData: CustomerInvoiceRow[] = invoices.map((inv: (typeof invoices)[number]) => {
    const displayAmount = inv.order
      ? inv.order.totalAmount
      : inv.bid
        ? gstBreakdown(inv.bid.totalBidAmount).total
        : 0;
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      orderId: inv.order?.id ?? null,
      orderNumber: inv.order?.orderNumber ?? null,
      bidId: inv.bid?.id ?? null,
      type: inv.type,
      issuedAt: inv.issuedAt.toISOString(),
      amountDisplay: displayAmount.toLocaleString("en-IN"),
    };
  });

  return (
    <div className="mx-auto max-w-7xl">
      <CustomerInvoicesListClient initialData={initialData} />
    </div>
  );
}
