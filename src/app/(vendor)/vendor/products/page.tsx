import { VendorListingToggle } from "@/components/vendor/VendorListingToggle";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function VendorProductsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!vendor) redirect("/auth/login");

  const listings = await prisma.productListing.findMany({
    where: { vendorId: vendor.id },
    orderBy: { product: { name: "asc" } },
    include: {
      product: { select: { name: true, slug: true, brand: true, isActive: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My listings</h1>
          <p className="mt-1 text-sm text-muted">
            These are your <strong className="text-slate-700">ProductListing</strong> rows: your price,
            stock, and SKU for each platform product. The storefront merges every vendor&apos;s listings
            into anonymous &quot;Option A / B&quot; tiers for buyers.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <p className="text-sm text-muted">
            <span className="font-medium text-slate-700">{listings.length}</span> listing
            {listings.length === 1 ? "" : "s"}
          </p>
          <Link
            href="/vendor/products/new"
            className="inline-flex rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Add listing
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-surface">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-800">Product</th>
              <th className="px-4 py-3 font-semibold text-slate-800">SKU</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Price (₹)</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Stock</th>
              <th className="px-4 py-3 font-semibold text-slate-800">MOQ</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Min bid (₹)</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Storefront</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Listing</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {listings.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-muted">
                  No listings yet. In this phase, catalog rows come from the{" "}
                  <code className="rounded bg-surface px-1 text-xs">npm run db:seed</code> script (or
                  future admin tools). Each product can have multiple vendor listings once those flows
                  exist.
                </td>
              </tr>
            ) : (
              listings.map((row) => (
                <tr key={row.id} className="bg-white hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{row.product.name}</p>
                    <p className="text-xs text-muted">{row.product.brand}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.sku}</td>
                  <td className="px-4 py-3">{row.unitPrice.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">{row.stockQty}</td>
                  <td className="px-4 py-3">{row.minOrderQty}</td>
                  <td className="px-4 py-3">{row.minBidPrice.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    {row.isActive && row.product.isActive ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                        Hidden / inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/products/${row.product.slug}`}
                      className="text-accent hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View as buyer
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <VendorListingToggle
                      listingId={row.id}
                      initialActive={row.isActive}
                      productActive={row.product.isActive}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/vendor/products/${row.id}/edit`}
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-muted">
        Data path: PostgreSQL tables <code className="rounded bg-surface px-1">Product</code> (shared
        catalog) and <code className="rounded bg-surface px-1">ProductListing</code> (your rows, keyed by{" "}
        <code className="rounded bg-surface px-1">vendorId</code> → your{" "}
        <code className="rounded bg-surface px-1">VendorProfile</code>). Public APIs read active
        listings and strip vendor identity on the storefront.
      </p>
    </div>
  );
}
