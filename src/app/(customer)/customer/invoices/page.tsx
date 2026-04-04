import { auth } from "@/lib/auth";
import { gstBreakdown } from "@/lib/gst";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
        <p className="mt-1 text-sm text-muted">Download tax invoices, proformas, and credit notes.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-surface text-xs font-semibold uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Invoice #</th>
              <th className="px-4 py-3">Order / bid</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Amount (₹)</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted">
                  No invoices yet. Tax invoices appear after payment; proformas appear when a bid is approved.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const displayAmount = inv.order
                  ? inv.order.totalAmount
                  : inv.bid
                    ? gstBreakdown(inv.bid.totalBidAmount).total
                    : 0;
                return (
                  <tr key={inv.id} className="bg-white">
                    <td className="px-4 py-3 font-mono">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3">
                      {inv.order ? (
                        <Link href={`/customer/orders/${inv.order.id}`} className="text-accent hover:underline">
                          {inv.order.orderNumber}
                        </Link>
                      ) : inv.bid ? (
                        <Link href={`/customer/bids/${inv.bid.id}`} className="text-accent hover:underline">
                          Bid request
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">{inv.type}</td>
                    <td className="px-4 py-3">{inv.issuedAt.toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3">{displayAmount.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`/api/customer/invoices/${inv.id}/download`}
                        className="font-medium text-accent hover:underline"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
