import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminInvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { issuedAt: "desc" },
    take: 200,
    include: {
      order: { select: { orderNumber: true, id: true, customerId: true } },
      bid: { select: { id: true } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
        <p className="mt-1 text-sm text-muted">Tax and proforma records linked to orders.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-surface text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Invoice#</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Issued</th>
              <th className="px-4 py-3">File</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="bg-white hover:bg-slate-50/80">
                <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNumber}</td>
                <td className="px-4 py-3">
                  {inv.order ? (
                    <Link href={`/admin/orders/${inv.order.id}`} className="text-accent hover:underline">
                      {inv.order.orderNumber}
                    </Link>
                  ) : inv.bid ? (
                    <Link href={`/admin/bids`} className="text-muted hover:underline">
                      Proforma (bid)
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">{inv.type}</td>
                <td className="px-4 py-3 text-xs text-muted">{inv.issuedAt.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">
                  <a
                    href={`/api/admin/invoices/${inv.id}/download`}
                    className="text-accent hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
