import { BTN } from "@/constants/design";
import Link from "next/link";

export function HomeCTA() {
  return (
    <section className="border-t border-white/6 bg-navy-light px-4 py-8 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-2 text-xl font-medium text-white">Ready to modernise laptop procurement?</h2>
        <p className="mb-5 text-sm text-white/45">
          Create a buyer account for catalog access, or register as a vendor to reach verified enterprise buyers.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/products" className={`inline-flex ${BTN.primary}`}>
            Browse Products
          </Link>
          <Link
            href="/auth/register?intent=vendor"
            className="inline-flex rounded-lg border border-white/30 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Register as Vendor
          </Link>
        </div>
      </div>
    </section>
  );
}
