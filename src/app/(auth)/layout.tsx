import Logo from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[55%] flex-col justify-between overflow-hidden bg-navy p-10 lg:flex">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative z-10">
          <Logo size="lg" variant="nav" />
        </div>
        <div className="relative z-10 flex max-w-md flex-1 flex-col justify-center">
          <h2 className="mb-8 text-[28px] font-medium leading-[1.3] text-white">
            India&apos;s verified B2B
            <br />
            laptop marketplace.
          </h2>
          <div className="space-y-5">
            {[
              {
                title: "Inspection-certified inventory",
                desc: "Every refurb lot physically verified before listing goes live",
              },
              {
                title: "Anonymous supplier pricing",
                desc: "Compare from 50+ verified vendors — identities stay private",
              },
              {
                title: "GST-compliant invoicing",
                desc: "All invoices under Rentfoxxy GSTIN — zero compliance risk",
              },
              {
                title: "Escrow-protected payments",
                desc: "Funds released to vendor only after you confirm delivery",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-verified/30 bg-verified/15">
                  <span className="text-[10px] font-bold text-verified">✓</span>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-white">{item.title}</p>
                  <p className="mt-0.5 text-[12px] text-white/40">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10">
          <div className="mb-4 rounded-xl border border-white/10 p-5">
            <p className="mb-3 text-[12px] italic leading-relaxed text-white/60">
              &ldquo;Rentfoxxy saved us 3 weeks of vendor hunting for our 200-laptop procurement. The verified
              grades and GST invoices made our finance team very happy.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber/30 bg-amber/20">
                <span className="text-[12px] font-bold text-amber">R</span>
              </div>
              <div>
                <p className="text-[12px] font-medium text-white">Rahul M.</p>
                <p className="text-[10px] text-white/40">IT Head, Acme Corp</p>
              </div>
            </div>
          </div>
          <div className="flex gap-6">
            {[
              ["500+", "Enterprises"],
              ["50+", "Vendors"],
              ["100%", "GST"],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="text-[18px] font-medium text-amber">{n}</p>
                <p className="text-[10px] text-white/35">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-center overflow-y-auto bg-white px-6 py-8 lg:w-[45%] lg:px-12">
        {children}
      </div>
    </div>
  );
}
