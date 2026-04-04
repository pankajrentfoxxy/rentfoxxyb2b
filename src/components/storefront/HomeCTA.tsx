import Link from "next/link";

export function HomeCTA() {
  return (
    <section className="bg-primary py-16 text-white">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
        <h2 className="text-2xl font-bold sm:text-3xl">Ready to streamline your IT procurement?</h2>
        <p className="mt-3 text-slate-300">
          Create a buyer account in minutes and unlock catalog access, bids, and GST invoices.
        </p>
        <Link
          href="/auth/register?intent=buyer"
          className="mt-8 inline-flex h-12 items-center rounded-lg bg-fox px-8 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-fox-light"
        >
          Register now
        </Link>
      </div>
    </section>
  );
}
