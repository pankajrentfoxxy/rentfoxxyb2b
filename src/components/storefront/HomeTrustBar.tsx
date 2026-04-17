const PARTNERS = ["TCS", "Wipro", "Truetech", "Gorefurbo"];

export function HomeTrustBar() {
  return (
    <section className="border-b border-t border-white/5 bg-navy py-2">
      <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4">
        <span className="mr-2 shrink-0 whitespace-nowrap text-[9px] font-medium uppercase tracking-widest text-white/20">
          Procurement partners
        </span>
        {PARTNERS.map((name) => (
          <span key={name} className="shrink-0 text-[11px] text-white/18">
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}
