import { auth } from "@/lib/auth";
import { normalizePublicImagePath } from "@/lib/image-url";
import { prisma } from "@/lib/prisma";
import type { BidStatus } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BidCountdown } from "@/components/customer/BidCountdown";

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

export default async function CustomerBidsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/auth/login");

  const tab = (searchParams.tab ?? "all") as Tab;
  const statusIn = tabFilter(tab);

  const bids = await prisma.bid.findMany({
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
  });

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
        <p className="mt-1 text-sm text-muted">Track requests and complete payment when approved.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/customer/bids?tab=${t.id}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              tab === t.id ? "bg-accent text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bids.length === 0 ? (
          <p className="col-span-full py-12 text-center text-sm text-muted">No bids in this view.</p>
        ) : (
          bids.map((b) => {
            const raw = b.listing.product.images[0];
            const img = raw ? normalizePublicImagePath(raw) : placeholder;
            const listMu = b.listing.unitPrice;
            const saving = Math.max(0, listMu - b.bidPricePerUnit);
            const highlight =
              b.status === "APPROVED" && (!b.expiresAt || b.expiresAt > now);
            return (
              <div
                key={b.id}
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
                      highlight ? "bg-amber-600 hover:bg-amber-700" : "bg-primary hover:bg-primary-light"
                    }`}
                  >
                    {highlight ? "Proceed to payment" : "View details"}
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
