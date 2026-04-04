import { FileText, Headphones, Percent, Plane, Truck, Zap } from "lucide-react";

const features = [
  { title: "GST-compliant billing", desc: "Tax invoices issued under Rentfoxxy identity.", icon: FileText },
  { title: "Price negotiation", desc: "Structured bids with supplier responses.", icon: Percent },
  { title: "Real-time tracking", desc: "Status timeline from order to delivery.", icon: Truck },
  { title: "Bulk discounts", desc: "Tier pricing shown as options, not vendor names.", icon: Zap },
  { title: "Dedicated support", desc: "Enterprise-ready assistance for procurement teams.", icon: Headphones },
  { title: "Fast dispatch", desc: "Operational playbooks aligned with major carriers.", icon: Plane },
];

export function HomeFeatures() {
  return (
    <section className="border-t border-slate-100 bg-surface py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900">Why Rentfoxxy</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <f.icon className="h-8 w-8 text-primary" aria-hidden />
              <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
