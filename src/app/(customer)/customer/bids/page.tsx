import { auth } from "@/lib/auth";
import { normalizePublicImagePath } from "@/lib/image-url";
import { prisma } from "@/lib/prisma";
import type { BidStatus } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BidCountdown } from "@/components/customer/BidCountdown";
import { FilterTabChip } from "@/components/commonStyle/FilterTabChip";

const placeholder =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" viewBox="0 0 200 140"><rect fill="#EEF2FF" width="200" height="140"/></svg>`,
  );

type Tab = "all" | "pending" | "approved" | "rejected" | "expired";

function tabFilter(tab: Tab): BidStatus[] | undefined {
  if (tab === "all") return undefined;
  if (tab === "pending") return ["PENDING"];
  if (tab === "approved") return ["APPROVED", "COUNTER_OFFERED", "PAID"];
  if (tab === "rejected") return ["REJECTED"];
  return ["EXPIRED", "CANCELLED"];
}

const TAB_IDS: Tab[] = ["all", "pending", "approved", "rejected", "expired"];

function parseTab(raw: string | undefined): Tab {
  if (raw && TAB_IDS.includes(raw as Tab)) return raw as Tab;
  return "all";
}

export default async function CustomerBidsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/auth/login");

  const sp = await searchParams;
  const tab = parseTab(sp.tab);
  const statusIn = tabFilter(tab);

  const [bids, lotBids, asAsBids] = await Promise.all([
    prisma.bid.findMany({
      where: {
        customerId: profile.id,
        ...(statusIn ? { status: { in: statusIn } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          include: {
            product: { select: { name: true, slug: true, images: true } },
          },
        },
      },
    }),
    prisma.lotBid.findMany({
      where: {
        customerId: profile.id,
        ...(statusIn ? { status: { in: statusIn } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { lot: { select: { id: true, title: true, pricePerLot: true } } },
    }),
    prisma.asAsBid.findMany({
      where: {
        customerId: profile.id,
        ...(statusIn ? { status: { in: statusIn } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { asas: { select: { id: true, title: true, avgUnitPrice: true } } },
    }),
  ]);

  const unified = [
    ...bids.map((b: (typeof bids)[number]) => ({ kind: "product" as const, createdAt: b.createdAt, data: b })),
    ...lotBids.map((b: (typeof lotBids)[number]) => ({ kind: "lot" as const, createdAt: b.createdAt, data: b })),
    ...asAsBids.map((b: (typeof asAsBids)[number]) => ({ kind: "asas" as const, createdAt: b.createdAt, data: b })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
    { id: "expired", label: "Expired" },
  ];

  const now = new Date();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bids</h1>
        <p className="mt-1 text-sm text-muted">
          Product bids, lot negotiations, and AsAs offers — pay when approved.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-2">
        {tabs.map((t) => (
          <FilterTabChip key={t.id} active={tab === t.id} href={`/customer/bids?tab=${t.id}`}>
            {t.label}
          </FilterTabChip>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {unified.length === 0 ? (
          <p className="col-span-full py-12 text-center text-sm text-muted">No bids in this view.</p>
        ) : (
          unified.map((row) => {
            if (row.kind === "product") {
              const b = row.data;
              const raw = b.listing.product.images[0];
              const img = raw ? normalizePublicImagePath(raw) : placeholder;
              const listMu = b.listing.unitPrice;
              const saving = Math.max(0, listMu - b.bidPricePerUnit);
              const highlight =
                b.status === "APPROVED" && (!b.expiresAt || b.expiresAt > now);
              return (
                <div
                  key={`p-${b.id}`}
                  className={`flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm ${
                    highlight ? "border-amber-400 ring-2 ring-amber-200" : "border-slate-200"
                  }`}
                >
                  <div className="relative aspect-video w-full bg-slate-100">
                    <Image
                      src={img}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized={img.startsWith("data:")}
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <span className="mb-1 w-fit rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      Product
                    </span>
                    <h2 className="font-semibold text-slate-900">{b.listing.product.name}</h2>
                    <p className="mt-1 text-sm text-muted">Qty {b.quantity}</p>
                    <p className="mt-2 text-sm">
                      Your bid:{" "}
                      <strong>₹{b.bidPricePerUnit.toLocaleString("en-IN")}</strong>/unit · Total ₹
                      {b.totalBidAmount.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-muted">
                      Reference list ₹{listMu.toLocaleString("en-IN")}/unit
                      {saving > 0 ? (
                        <span className="text-emerald-700"> · Save ~₹{saving.toLocaleString("en-IN")}/unit</span>
                      ) : null}
                    </p>
                    <p className="mt-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize">
                        {b.status.toLowerCase().replace(/_/g, " ")}
                      </span>
                    </p>
                    {b.status === "APPROVED" && b.expiresAt && b.expiresAt > now ? (
                      <p className="mt-2 text-xs text-orange-800">
                        Pay within <BidCountdown expiresAt={b.expiresAt.toISOString()} />
                      </p>
                    ) : null}
                    <Link
                      href={`/customer/bids/${b.id}`}
                      className={`mt-4 inline-flex justify-center rounded-lg py-2 text-center text-sm font-semibold text-white ${
                        highlight ? "bg-amber hover:bg-amber-dark" : "bg-navy hover:bg-navy-light"
                      }`}
                    >
                      {highlight ? "Proceed to payment" : "View details"}
                    </Link>
                  </div>
                </div>
              );
            }
            if (row.kind === "lot") {
              const b = row.data;
              const listPl = b.lot.pricePerLot;
              const saving = Math.max(0, listPl - b.bidPricePerLot);
              const highlight = b.status === "APPROVED";
              return (
                <div
                  key={`l-${b.id}`}
                  className={`flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm ${
                    highlight ? "border-amber-400 ring-2 ring-amber-200" : "border-slate-200"
                  }`}
                >
                  <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-navy/20 to-lot/20">
                    <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-navy">
                      Lot negotiation
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <span className="mb-1 w-fit rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                      Lot
                    </span>
                    <h2 className="font-semibold text-slate-900">{b.lot.title}</h2>
                    <p className="mt-1 text-sm text-muted">{b.lotsCount} lot(s)</p>
                    <p className="mt-2 text-sm">
                      Your offer:{" "}
                      <strong>₹{b.bidPricePerLot.toLocaleString("en-IN")}</strong>/lot · Total ₹
                      {b.totalBidAmount.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-muted">
                      Reference ₹{listPl.toLocaleString("en-IN")}/lot
                      {saving > 0 ? (
                        <span className="text-emerald-700"> · Below list ~₹{saving.toLocaleString("en-IN")}/lot</span>
                      ) : null}
                    </p>
                    <p className="mt-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize">
                        {b.status.toLowerCase().replace(/_/g, " ")}
                      </span>
                    </p>
                    <Link
                      href={`/sales/lots/${b.lot.id}`}
                      className="mt-4 inline-flex justify-center rounded-lg bg-navy py-2 text-center text-sm font-semibold text-white hover:bg-navy-light"
                    >
                      View lot
                    </Link>
                  </div>
                </div>
              );
            }
            const b = row.data;
            const listU = b.asas.avgUnitPrice;
            const saving = Math.max(0, listU - b.bidPricePerUnit);
            const highlight = b.status === "APPROVED";
            return (
              <div
                key={`a-${b.id}`}
                className={`flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm ${
                  highlight ? "border-amber-400 ring-2 ring-amber-200" : "border-slate-200"
                }`}
              >
                <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-asas-bg to-asas-border">
                  <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-asas-text">
                    AsAs offer
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <span className="mb-1 w-fit rounded bg-asas-bg px-2 py-0.5 text-xs font-medium text-asas-text">
                    AsAs
                  </span>
                  <h2 className="font-semibold text-slate-900">{b.asas.title}</h2>
                  <p className="mt-1 text-sm text-muted">{b.quantity} units</p>
                  <p className="mt-2 text-sm">
                    Your offer:{" "}
                    <strong>₹{b.bidPricePerUnit.toLocaleString("en-IN")}</strong>/unit · Total ₹
                    {b.totalBidAmount.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-muted">
                    Reference ~₹{listU.toLocaleString("en-IN")}/unit
                    {saving > 0 ? (
                      <span className="text-emerald-700"> · Below ref ~₹{saving.toLocaleString("en-IN")}/unit</span>
                    ) : null}
                  </p>
                  <p className="mt-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize">
                      {b.status.toLowerCase().replace(/_/g, " ")}
                    </span>
                  </p>
                  <Link
                    href={`/asas/listings/${b.asas.id}`}
                    className="mt-4 inline-flex justify-center rounded-lg bg-asas py-2 text-center text-sm font-semibold text-white hover:bg-asas-dark"
                  >
                    View listing
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
