import { ProductsBrowser } from "@/components/storefront/ProductsBrowser";
import { Suspense } from "react";

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24 text-muted">Loading catalog…</div>
      }
    >
      <ProductsBrowser />
    </Suspense>
  );
}
