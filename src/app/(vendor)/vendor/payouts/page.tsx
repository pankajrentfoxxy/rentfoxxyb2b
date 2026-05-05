import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import VendorPayoutsListClient, { type VendorPayoutRow } from "./VendorPayoutsListClient";

export default async function VendorPayoutsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!vendor) redirect("/auth/login");

  const rows = await prisma.payout.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      order: { select: { orderNumber: true, id: true } },
    },
  });

  const totals = rows.reduce(
    (acc: { gross: number; released: number; pending: number }, p: (typeof rows)[number]) => {
      acc.gross += p.grossAmount;
      if (p.status === "RELEASED") acc.released += p.netAmount;
      else if (p.status === "PENDING" || p.status === "PROCESSING") acc.pending += p.netAmount;
      return acc;
    },
    { gross: 0, released: 0, pending: 0 },
  );

  const initialData: VendorPayoutRow[] = rows.map((p: (typeof rows)[number]) => ({
    id: p.id,
    createdAt: p.createdAt.toISOString(),
    orderNumber: p.order.orderNumber,
    grossAmount: p.grossAmount,
    commissionAmount: p.commissionAmount,
    commissionRate: p.commissionRate,
    netAmount: p.netAmount,
    status: p.status,
    utrNumber: p.utrNumber,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="space-y-3">
        <h2 className="px-2 text-sm font-black tracking-tight text-slate-900">Summary</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Pending / processing</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              ₹{totals.pending.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Released</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              ₹{totals.released.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Listed gross (all rows)</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              ₹{totals.gross.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </section>

      <VendorPayoutsListClient initialData={initialData} />
    </div>
  );
}
