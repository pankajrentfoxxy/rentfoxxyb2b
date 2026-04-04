import { AdminGradeCApprovals } from "@/components/admin/AdminGradeCApprovals";
import { AdminProductEditor } from "@/components/admin/AdminProductEditor";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      listings: {
        include: { vendor: { select: { companyName: true, id: true } } },
        orderBy: { unitPrice: "asc" },
      },
    },
  });
  if (!p) notFound();

  const pendingGradeC = p.listings.filter(
    (l) => l.requiresAdminApproval && l.condition === "REFURB_C",
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Link href="/admin/products" className="text-sm text-accent hover:underline">
          ← Products
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{p.name}</h1>
        <p className="text-sm text-muted">
          {p.category.name} · public{" "}
          <Link href={`/products/${p.slug}`} className="text-accent hover:underline" target="_blank">
            /products/{p.slug}
          </Link>
        </p>
      </div>

      <AdminProductEditor
        productId={p.id}
        initial={{
          name: p.name,
          slug: p.slug,
          description: p.description,
          brand: p.brand,
          hsnCode: p.hsnCode,
          isFeatured: p.isFeatured,
          isActive: p.isActive,
          images: p.images,
          specs: p.specs,
        }}
      />

      <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Pending Grade C approval</h2>
        <p className="mt-1 text-xs text-muted">
          Listings below need review before they appear on the storefront.
        </p>
        <AdminGradeCApprovals
          listings={pendingGradeC.map((l) => ({
            id: l.id,
            sku: l.sku,
            condition: l.condition,
            conditionNotes: l.conditionNotes,
            refurbImages: l.refurbImages,
            unitPrice: l.unitPrice,
            vendor: { id: l.vendorId, companyName: l.vendor.companyName },
          }))}
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Vendor listings (admin only)</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-surface text-xs uppercase text-muted">
              <tr>
                <th className="px-3 py-2">Vendor</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Condition</th>
                <th className="px-3 py-2">Unit ₹</th>
                <th className="px-3 py-2">Min bid ₹</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Active</th>
                <th className="px-3 py-2">Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {p.listings.map((l) => (
                <tr key={l.id}>
                  <td className="px-3 py-2">
                    <Link href={`/admin/vendors/${l.vendorId}`} className="text-accent hover:underline">
                      {l.vendor.companyName}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{l.sku}</td>
                  <td className="px-3 py-2 text-xs">{l.condition.replace(/_/g, " ")}</td>
                  <td className="px-3 py-2">{l.unitPrice.toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2">{l.minBidPrice.toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2">{l.stockQty}</td>
                  <td className="px-3 py-2">{l.isActive ? "Yes" : "No"}</td>
                  <td className="px-3 py-2 text-xs">
                    {l.requiresAdminApproval ? (
                      <span className="font-medium text-amber-800">Pending</span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
