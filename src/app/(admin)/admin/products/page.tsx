import { CONDITION_SORT_RANK, GRADE_CONFIG } from "@/constants/grading";
import { normalizePublicImagePath } from "@/lib/image-url";
import { prisma } from "@/lib/prisma";
import type { ProductCondition } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ pendingGradeC?: string }>;
}) {
  const sp = await searchParams;
  const pendingOnly = sp.pendingGradeC === "1";

  const products = await prisma.product.findMany({
    where: pendingOnly
      ? {
          listings: {
            some: { requiresAdminApproval: true, condition: "REFURB_C" },
          },
        }
      : undefined,
    orderBy: { name: "asc" },
    include: {
      category: { select: { name: true } },
      listings: {
        select: {
          unitPrice: true,
          isActive: true,
          vendorId: true,
          condition: true,
          requiresAdminApproval: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catalog</h1>
          <p className="mt-1 text-sm text-muted">Master products and vendor listing visibility.</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/admin/products"
            className={`rounded-lg border px-3 py-2 font-medium ${!pendingOnly ? "border-accent bg-accent-light text-accent" : "border-slate-200 text-slate-700"}`}
          >
            All products
          </Link>
          <Link
            href="/admin/products?pendingGradeC=1"
            className={`rounded-lg border px-3 py-2 font-medium ${pendingOnly ? "border-amber-500 bg-amber-50 text-amber-900" : "border-slate-200 text-slate-700"}`}
          >
            Grade C pending only
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-surface text-xs font-semibold uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Condition (live)</th>
              <th className="px-4 py-3">Vendors</th>
              <th className="px-4 py-3">Price range (₹)</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => {
              const live = p.listings.filter((l) => l.isActive && !l.requiresAdminApproval);
              const prices = live.map((l) => l.unitPrice);
              const minP = prices.length ? Math.min(...prices) : 0;
              const maxP = prices.length ? Math.max(...prices) : 0;
              const vendorCount = new Set(p.listings.map((l) => l.vendorId)).size;
              const img = p.images[0] ? normalizePublicImagePath(p.images[0]) : null;
              const condLabels = Array.from(new Set(live.map((l) => l.condition as ProductCondition))).sort(
                (a, b) => CONDITION_SORT_RANK[a] - CONDITION_SORT_RANK[b],
              );
              const condStr = condLabels.map((c) => GRADE_CONFIG[c].label).join(", ") || "—";
              const pendingCCount = p.listings.filter(
                (l) => l.requiresAdminApproval && l.condition === "REFURB_C",
              ).length;
              return (
                <tr key={p.id} className="bg-white hover:bg-slate-50/80">
                  <td className="px-4 py-2">
                    {img ? (
                      <Image
                        src={img}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-slate-100" />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                  <td className="px-4 py-3">{p.category.name}</td>
                  <td className="px-4 py-3">{p.brand}</td>
                  <td className="px-4 py-3 text-xs">
                    <span>{condStr}</span>
                    {pendingCCount > 0 ? (
                      <span className="ml-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-900">
                        {pendingCCount} C pending
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{vendorCount}</td>
                  <td className="px-4 py-3 text-xs">
                    {prices.length ? `${minP.toLocaleString("en-IN")} – ${maxP.toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200"}`}
                    >
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                    {p.isFeatured ? (
                      <span className="ml-1 rounded-full bg-fox-light px-2 py-0.5 text-xs font-medium text-amber-900">
                        Featured
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="text-accent hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
