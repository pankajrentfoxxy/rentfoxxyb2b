import { AdminVendorControls } from "@/components/admin/AdminVendorControls";
import { OrderStatusBadge } from "@/components/shared/StatusBadge";
import { PAYMENT_METHOD_CONFIG, type PaymentMethodId } from "@/constants/payment-methods";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  Ban,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  Package,
  ShieldCheck,
  Wallet,
  ShoppingBag,
} from "lucide-react";

import Link from "next/link";
import { notFound } from "next/navigation";
import { cloneElement, type ReactElement, type ReactNode } from "react";

const BRAND_TEXT = "text-amber-600";

/** Section shell: compact radius and padding */
const sectionCard = "overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-sm";
const sectionHead =
  "flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-3 py-2 sm:px-4";
const sectionTitle = "flex items-center gap-1.5 text-sm font-semibold leading-tight text-slate-800";
const sectionBody = "p-3 sm:p-4";
const sectionCardGrow = `${sectionCard} flex h-full min-h-0 flex-col`;

/** Two equal columns on lg; cells stretch to the row’s max height */
const pairRow = "grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5 lg:items-stretch";

function InfoBlock({
  label,
  value,
  icon,
  badge = false,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactElement<{ size?: number; className?: string }>;
  badge?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {icon &&
          cloneElement(icon, {
            size: 11,
            className: "shrink-0 opacity-60",
          })}
        {label}
      </p>
      {badge ? (
        <span className="inline-flex rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
          {value}
        </span>
      ) : (
        <p className="text-xs font-medium leading-snug text-slate-900">{value}</p>
      )}
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border border-slate-100 bg-white px-2 py-2 text-center shadow-sm">
      <p className="text-[9px] font-semibold uppercase leading-tight tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-xs font-semibold leading-snug text-slate-900">{value}</p>
    </div>
  );
}

function StatusNavIcon({ status }: { status: string }) {
  const cls = "shrink-0";
  if (status === "ACTIVE") return <CheckCircle2 size={12} className={cls} />;
  if (status === "PENDING_APPROVAL") return <Clock size={12} className={cls} />;
  if (status === "SUSPENDED") return <Ban size={12} className={cls} />;
  return <Clock size={12} className={cls} />;
}

function vendorStatusLabel(status: string) {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "PENDING_APPROVAL":
      return "Pending approval";
    case "SUSPENDED":
      return "Suspended";
    default:
      return status;
  }
}

export default async function AdminVendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await prisma.vendorProfile.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, name: true, phone: true, createdAt: true, isVerified: true } },
      listings: {
        include: { product: { select: { name: true, slug: true, category: { select: { name: true } } } } },
      },
    },
  });
  if (!v) notFound();

  const orders = await prisma.order.findMany({
    where: { items: { some: { listing: { vendorId: v.id } } } },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      status: true,
      createdAt: true,
    },
  });

  const payouts = await prisma.payout.findMany({
    where: { vendorId: v.id },
    orderBy: { createdAt: "desc" },
    take: 25,
    include: { order: { select: { orderNumber: true } } },
  });

  return (
    <div className="min-h-screen bg-slate-50/60 pb-6 font-sans text-slate-900 antialiased">

      <main className="mx-auto max-w-6xl px-3 pt-4 sm:px-4">
        <header className="mb-4 border-b border-slate-200/80 pb-3">
          <h1 className="flex items-center gap-2 text-lg font-semibold leading-tight tracking-tight text-slate-900 sm:text-xl whitespace-nowrap">
            <Link
              href="/admin/vendors"
              className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Back to vendors"
            >
              <ArrowLeft size={17} strokeWidth={2} />
            </Link>

            <span className="truncate">{v.companyName}</span>
          </h1>
          <p className="mt-1 ml-9 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs leading-snug text-slate-500">
            <span className="break-all">{v.user.email}</span>
            <span className="text-slate-300">·</span>
            <span className="font-mono text-[11px] text-slate-400">ID {v.id}</span>
          </p>
        </header>

        <div className="space-y-4 lg:space-y-5">
          {/* Row 1: Business overview | Control center */}
          <div className={pairRow}>
            <section className={sectionCardGrow}>
              <div className={sectionHead}>
                <h2 className={sectionTitle}>
                  <ShieldCheck className={BRAND_TEXT} size={15} strokeWidth={2} />
                  Business overview
                </h2>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                 
                  <span className="hidden items-center gap-1 text-[11px] leading-tight text-slate-400 sm:inline-flex">
                    <Clock size={11} />
                    {v.approvedAt ? v.approvedAt.toLocaleString("en-IN") : "Not approved"}
                  </span>
                </div>
              </div>
              <div className={`${sectionBody} min-h-0 flex-1`}>
                <p className="mb-3 flex items-center gap-1 text-[11px] text-slate-400 sm:hidden">
                  <Clock size={11} />
                  {v.approvedAt ? v.approvedAt.toLocaleString("en-IN") : "Not approved"}
                </p>
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <InfoBlock label="GSTIN" value={v.gstin} icon={<Building2 size={16} />} />
                  <InfoBlock label="PAN" value={v.pan} icon={<FileText size={16} />} />
                  <InfoBlock
                    label="User verified"
                    value={v.user.isVerified ? "Yes" : "No"}
                    icon={<ShieldCheck size={16} />}
                    badge={v.user.isVerified}
                  />
                  <InfoBlock
                    label="Vendor status"
                    value={vendorStatusLabel(v.status)}
                    icon={<StatusNavIcon status={v.status} />}
                    badge={true}
                  />
                  <div className="rounded-md border border-slate-100 bg-slate-50/80 p-3 sm:col-span-2">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Settlement account
                    </p>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm">
                        <Wallet className={BRAND_TEXT} size={15} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold leading-snug text-slate-900">{v.accountName}</p>
                        <p className="mt-0.5 font-mono text-[11px] leading-snug text-slate-500">
                          {v.ifscCode} ·
                          {v.bankAccount.length >= 4
                            ? ` ****${v.bankAccount.slice(-4)}`
                            : ` ${v.bankAccount}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <AdminVendorControls
              vendorId={v.id}
              status={v.status}
              commissionRate={v.commissionRate}
              className="min-h-0"
            />
          </div>

          {/* Row 2: Payment preferences | Active listings */}
          <div className={pairRow}>
            <section className={sectionCardGrow}>
              <div className="border-b border-slate-100 px-3 py-2 sm:px-4">
                <h2 className={sectionTitle}>
                  <CreditCard className={BRAND_TEXT} size={15} strokeWidth={2} />
                  Payment preferences
                </h2>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                  Read-only rules for bids & checkout (from vendor profile).
                </p>
              </div>
              <div className={`${sectionBody} min-h-0 flex-1 space-y-4`}>
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Accepted methods
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(v.acceptedPaymentMethods as string[]).length ? (
                      (v.acceptedPaymentMethods as PaymentMethodId[]).map((pm) => (
                        <span
                          key={pm}
                          className="inline-flex items-center rounded-md border border-amber-100/90 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800"
                        >
                          {PAYMENT_METHOD_CONFIG[pm]?.label ?? pm}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">—</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2">
                  <StatMini label="Full advance" value={v.requiresFullAdvance ? "Yes" : "No"} />
                  <StatMini
                    label="NEFT/RTGS"
                    value={
                      v.minOrderForRTGS != null
                        ? `≥ ₹${Number(v.minOrderForRTGS).toLocaleString("en-IN")}`
                        : "—"
                    }
                  />
                  <StatMini label="Min. token %" value={`${v.minTokenPercentage}%`} />
                  <StatMini label="Token on bids" value={v.acceptsTokenPayment ? "Yes" : "No"} />
                </div>
              </div>
            </section>

            <section id="listings" className={sectionCardGrow}>
              <div className={sectionHead}>
                <h2 className={sectionTitle}>
                  <Package className={BRAND_TEXT} size={15} strokeWidth={2} />
                  Active listings
                  <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-px text-[11px] font-medium text-slate-600">
                    {v.listings.length}
                  </span>
                </h2>
              </div>
            <div className="min-h-0 flex-1 max-h-[220px] divide-y divide-slate-100 overflow-y-auto overscroll-contain">
                {v.listings.map((l) => (
                  <div
                    key={l.id}
                    className="group flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400 transition-colors group-hover:bg-white group-hover:shadow-sm">
                        <Package size={15} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium leading-snug text-slate-900">
                          {l.product.name}
                        </p>
                        <p className="text-[11px] leading-snug text-slate-500">{l.product.category.name}</p>
                      </div>
                    </div>
                    <Link
                      href={`/admin/products/${l.productId}`}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-transparent px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:border-amber-100 hover:bg-white hover:text-amber-700 hover:shadow-sm"
                    >
                      Manage
                      <ExternalLink size={12} strokeWidth={2} />
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Row 3: Recent orders | Payouts */}
          <div className={pairRow}>
            <section id="recent-orders" className={sectionCardGrow}>
              <div className={`${sectionHead} justify-between`}>
                <h2 className={sectionTitle}>
                  <ShoppingBag className={BRAND_TEXT} size={15} strokeWidth={2} />
                  Recent orders
                </h2>
                <Link href="/admin/orders" className={`text-xs font-medium ${BRAND_TEXT} hover:underline`}>
                  All orders
                </Link>
              </div>
              <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
                <table className="w-full min-w-[400px] text-left text-xs">
                  <thead className="sticky top-0 z-[1]">
                    <tr className="border-b border-slate-100 bg-slate-50/95 text-[10px] font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-sm">
                      <th className="whitespace-nowrap px-3 py-2 sm:px-4">Order</th>
                      <th className="whitespace-nowrap px-3 py-2 sm:px-4">Date</th>
                      <th className="whitespace-nowrap px-3 py-2 sm:px-4">Amount</th>
                      <th className="whitespace-nowrap px-3 py-2 pr-3 text-right sm:px-4 sm:pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="transition-colors hover:bg-slate-50/80">
                        <td className="px-3 py-2 sm:px-4">
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className={`font-mono text-xs font-semibold ${BRAND_TEXT} hover:underline`}
                          >
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-[11px] text-slate-600 sm:px-4">
                          {o.createdAt.toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-medium tabular-nums text-slate-800 sm:px-4">
                          ₹{o.totalAmount.toLocaleString("en-IN")}
                        </td>
                        <td className="px-1 py-2 text-right sm:px-4">
                          <OrderStatusBadge
                            status={o.status}
                            className="!px-2 !py-0.5 !text-[10px] !font-medium"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="payouts" className={sectionCardGrow}>
              <div className={sectionHead}>
                <h2 className={sectionTitle}>
                  <CreditCard className={BRAND_TEXT} size={15} strokeWidth={2} />
                  Payouts
                </h2>
              </div>
              <ul className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto overscroll-contain text-xs">
                {payouts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4">
                    <span className="min-w-0 truncate text-slate-700">
                      {p.order.orderNumber} · {p.status}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                      ₹{p.netAmount.toLocaleString("en-IN")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="rounded-lg border border-dashed border-slate-300/90 bg-slate-50/80 px-4 py-4 text-center sm:px-6 sm:py-5">
            <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
              <FileText size={18} strokeWidth={2} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Legal documents</h3>
            <p className="mx-auto mt-1 max-w-lg text-[11px] leading-snug text-slate-500">
              Verification certificates and MOA.{" "}
              <span className="font-medium italic text-amber-700">UploadThing pending.</span>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
