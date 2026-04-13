import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-primary">About Rentfoxxy</h1>
      <p className="mt-3 text-lg text-slate-700">
        Rentfoxxy is a B2B marketplace for refurbished IT — laptops, desktops, and related inventory — built for
        resellers, refurbishers, and fleet buyers who need transparent grading, clear pricing, and dependable
        fulfilment.
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">What we do</h2>
        <p className="text-slate-700">
          We connect verified suppliers with business buyers: catalogue SKUs with standard condition grades, bulk lot
          sales with AI-assisted manifests, and As-Is listings for full-catalogue purchases. Payments can be made in
          full or with a small token to lock stock, with the balance due within a fixed window so both sides know the
          rules up front.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Trust &amp; transparency</h2>
        <ul className="list-inside list-disc space-y-2 text-slate-700">
          <li>Consistent condition labels (including Refurb D for heavier cosmetic wear where applicable).</li>
          <li>Supplier verification before listings go live; inspectors can validate high-risk lines.</li>
          <li>Clear GST-inclusive checkout and documented payment milestones for token-based orders.</li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
        <p className="text-slate-700">
          Questions about onboarding or a specific listing?{" "}
          <Link href="/contact" className="font-medium text-accent hover:underline">
            Reach us via the contact page
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
