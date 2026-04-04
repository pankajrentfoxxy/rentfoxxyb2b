import { CreditCard, PackageSearch, Search, Truck } from "lucide-react";

const steps = [
  { n: 1, title: "Browse & compare", desc: "Filter by specs and see anonymised price options.", icon: Search },
  { n: 2, title: "Request a quote", desc: "Submit bids or checkout instantly at listed prices.", icon: PackageSearch },
  { n: 3, title: "Pay securely", desc: "Razorpay-powered payments with GST-ready invoices.", icon: CreditCard },
  { n: 4, title: "Track delivery", desc: "Live status updates until delivery confirmation.", icon: Truck },
];

export function HowItWorks() {
  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900">How it works</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-xl border border-slate-100 bg-surface p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                {s.n}
              </div>
              <s.icon className="mx-auto mt-4 h-8 w-8 text-accent" aria-hidden />
              <h3 className="mt-3 font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
