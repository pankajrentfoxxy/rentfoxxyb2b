const BUYER_STEPS = [
  { n: 1, title: "Browse verified lots", desc: "Filter by grade, brand, and MOQ without exposing vendor identities upfront." },
  { n: 2, title: "Bid or buy instantly", desc: "Structured bids with clear timelines, or checkout at listed B2B prices." },
  { n: 3, title: "Invoice & fulfilment", desc: "GST-ready paperwork and tracking through to delivery confirmation." },
];

const VENDOR_STEPS = [
  { n: 1, title: "List inventory", desc: "Upload lots and line-items with grading aligned to Rentfoxxy standards." },
  { n: 2, title: "Respond to demand", desc: "Receive bids and orders with anonymised buyer context until award." },
  { n: 3, title: "Get paid", desc: "Payments and settlements per agreed commercial terms on-platform." },
];

export function HowItWorks() {
  return (
    <section className="bg-navy px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-6 text-center text-xl font-medium text-white">How it works</h2>
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-widest text-white/40 md:text-left">
              For Buyers
            </p>
            <ul className="space-y-5">
              {BUYER_STEPS.map((s) => (
                <li key={s.n} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber text-sm font-semibold text-navy">
                    {s.n}
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-white">{s.title}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-white/45">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-widest text-white/40 md:text-left">
              For Vendors
            </p>
            <ul className="space-y-5">
              {VENDOR_STEPS.map((s) => (
                <li key={s.n} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber text-sm font-semibold text-navy">
                    {s.n}
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-white">{s.title}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-white/45">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
