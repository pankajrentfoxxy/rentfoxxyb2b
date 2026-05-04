import { AdminCustomerControls } from "@/components/admin/AdminCustomerControls";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  FileText,
  Gavel,
  Phone,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  UserCheck,
} from "lucide-react";

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.customerProfile.findUnique({
    where: { id },
    include: {
      user: true,
      orders: { orderBy: { createdAt: "desc" }, take: 30 },
      bids: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { listing: { include: { product: { select: { name: true } } } } },
      },
    },
  });
  if (!c) notFound();

  const displayName = c.companyName ?? c.user.name ?? c.user.email;
  const overviewTime = c.user.updatedAt.toLocaleString("en-IN", {
    dateStyle: "short",
    timeStyle: "medium",
  });

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 border-b border-slate-200/80 pb-4">
          <div className="flex items-center justify-between">
            <h1 className="flex items-center gap-2 text-xl font-bold leading-tight tracking-tight text-slate-900 whitespace-nowrap">
              <Link
                href="/admin/customers"
                className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Back to customers"
              >
                <ArrowLeft size={18} strokeWidth={2.5} />
              </Link>
              <span>{displayName}</span>
            </h1>
          </div>
          <p className="mt-1 ml-9 flex flex-wrap items-center gap-x-2 text-sm leading-snug text-slate-400">
            <span>{c.user.email}</span>
            <span className="text-slate-200">•</span>
            <span className="font-mono text-[12px]">
              ID <span className="text-slate-600">{c.id}</span>
            </span>
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} className="text-amber-500" />
                  <h2 className="text-sm font-bold text-slate-800">Business overview</h2>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock size={14} />
                  <span className="text-[11px] font-medium">{overviewTime}</span>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <FileText size={12} /> GSTIN
                    </p>
                    <p className="text-sm font-bold text-slate-800">{c.gstin ?? "—"}</p>
                  </div>
                  <div>
                    <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <Phone size={12} /> Phone
                    </p>
                    <p className="text-sm font-bold text-slate-800">{c.user.phone ?? "—"}</p>
                  </div>
                  <div>
                    <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <UserCheck size={12} /> User verified
                    </p>
                    <span
                      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[11px] font-bold ${
                        c.user.isVerified
                          ? "border-green-100 bg-green-50 text-green-600"
                          : "border-red-100 bg-red-50 text-red-600"
                      }`}
                    >
                      {c.user.isVerified ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <ShieldCheck size={12} /> Customer status
                    </p>
                    <span className="inline-flex items-center rounded-md border border-green-100 bg-green-50 px-2.5 py-0.5 text-[11px] font-bold text-green-600">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300">
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                      <ShoppingBag size={20} />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-tight text-slate-800">Orders</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {c.orders.length === 0 ? "No orders yet" : `${c.orders.length} recent`}
                  </span>
                </div>
                {c.orders.length > 0 && (
                  <ul className="divide-y divide-slate-100 border-t border-slate-100 px-5 py-2 text-sm">
                    {c.orders.map((o) => (
                      <li key={o.id} className="flex justify-between gap-4 py-2.5 first:pt-3 last:pb-3">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="font-medium text-amber-600 hover:underline"
                        >
                          {o.orderNumber}
                        </Link>
                        <span className="shrink-0 text-xs text-slate-600">
                          ₹{o.totalAmount.toLocaleString("en-IN")} · {o.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300">
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                      <Gavel size={20} />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-tight text-slate-800">Bids</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {c.bids.length === 0 ? "No bids yet" : `${c.bids.length} recent`}
                  </span>
                </div>
                {c.bids.length > 0 && (
                  <ul className="divide-y divide-slate-100 border-t border-slate-100 px-5 py-2 text-sm">
                    {c.bids.map((b) => (
                      <li key={b.id} className="flex justify-between gap-4 py-2.5 first:pt-3 last:pb-3">
                        <span className="font-medium text-slate-800">{b.listing.product.name}</span>
                        <span className="shrink-0 text-xs text-slate-600">{b.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <AdminCustomerControls
              customerProfileId={c.id}
              isVerified={c.user.isVerified}
              gstVerified={c.gstVerified}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
