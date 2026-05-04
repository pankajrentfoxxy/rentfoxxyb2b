import { prisma } from "@/lib/prisma";
import InvoiceListClient, { InvoiceRow } from "./InvoiceListClient";

export default async function AdminInvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { issuedAt: "desc" },
    take: 200,
    include: {
      order: { select: { orderNumber: true, id: true, customerId: true } },
      bid: { select: { id: true } },
    },
  });

  const initialData: InvoiceRow[] = invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    orderId: inv.order?.id ?? null,
    orderNumber: inv.order?.orderNumber ?? null,
    hasBidProforma: inv.bid != null,
    typeRaw: inv.type,
    typeDisplay: inv.type.replace(/_/g, " "),
    issuedDisplay: inv.issuedAt.toLocaleString("en-IN"),
  }));

  return (
    <div className="mx-auto max-w-7xl">
      <InvoiceListClient initialData={initialData} />
    </div>
  );
}
