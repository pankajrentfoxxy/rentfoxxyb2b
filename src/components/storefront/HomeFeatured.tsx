import type { PublicProductCard } from "@/lib/public-api";
import { ProductCard } from "@/components/storefront/ProductCard";

export function HomeFeatured({ products }: { products: PublicProductCard[] }) {
  if (!products.length) return null;
  return (
    <section className="bg-surface py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900">Top deals this week</h2>
        <p className="mt-1 text-muted">Featured SKUs with competitive B2B pricing</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
