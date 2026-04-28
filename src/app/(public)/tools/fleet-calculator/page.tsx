"use client";

import {
  FLEET_GRADE_CONFIG,
  FLEET_NEW_UNIT_PRICE,
  type FleetGradeKey,
} from "@/constants/fleet-calculator";
import Link from "next/link";
import { useMemo, useState } from "react";

function fmtINR(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function fmtLakh(n: number): string {
  const l = n / 100000;
  return `₹${(Math.round(l * 10) / 10).toFixed(1)}L`;
}

const NEW_PRICE = FLEET_NEW_UNIT_PRICE;

export default function FleetCalculatorPage() {
  const [fleetSize, setFleetSize] = useState(100);
  const [fleetAge, setFleetAge] = useState(3);
  const [grade, setGrade] = useState<FleetGradeKey>("Refurb A+");
  const [downloading, setDownloading] = useState(false);

  const cfg = FLEET_GRADE_CONFIG[grade];
  const newTotal = fleetSize * NEW_PRICE;
  const refurbTotal = fleetSize * cfg.price;
  const savings = Math.max(0, newTotal - refurbTotal);
  const savingsPct = newTotal > 0 ? Math.round((savings / newTotal) * 100) : 0;
  const savePerUnit = NEW_PRICE - cfg.price;
  const extraUnits = cfg.price > 0 ? Math.floor(savings / cfg.price) : 0;
  const refurbBarW = newTotal > 0 ? Math.min(100, Math.round((refurbTotal / newTotal) * 100)) : 0;

  const { insight1, insight2, insight3 } = useMemo(() => {
    const i1 =
      fleetAge <= 2
        ? `At ${fleetAge} year(s), your fleet is relatively fresh — focus on the bottom 20% highest-usage units first.`
        : fleetAge >= 6
          ? `At ${fleetAge} years, your fleet urgently needs refresh. Hardware this old loses ~40% productivity vs modern units.`
          : `At ${fleetAge} years average age, your fleet is approaching refresh territory. ${grade} units offer near-new performance at ${savingsPct}% lower cost.`;
    const i2 =
      fleetSize >= 200
        ? `With ${fleetSize.toLocaleString("en-IN")} units, consider a Lot Sale on Rentfoxxy — bulk lots typically unlock an extra 10-15% discount.`
        : `With ${fleetSize} units, try bidding for a custom price — orders above 20 units often get 5-10% negotiated discounts.`;
    const i3 = `Your savings of ${fmtLakh(savings)} can fund ${extraUnits} additional ${grade} units at no extra budget — effectively growing your fleet for free.`;
    return { insight1: i1, insight2: i2, insight3: i3 };
  }, [fleetAge, fleetSize, grade, savingsPct, savings, extraUnits]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch("/api/tools/fleet-calculator/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fleetSize,
          fleetAge,
          avgAge: fleetAge,
          grade,
          refurbPricePerUnit: cfg.price,
          newPricePerUnit: NEW_PRICE,
          avgNewPrice: NEW_PRICE,
          avgRefurbPrice: cfg.price,
          newTotal,
          refurbTotal,
          savings,
          savingsPct,
        }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rentfoxxy-fleet-renewal-report-${fleetSize}units.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="border-b border-border bg-white px-4 py-2.5">
        <div className="mx-auto max-w-6xl">
          <nav className="flex items-center gap-1.5 text-[11px] text-ink-muted">
            <Link href="/" className="hover:text-navy">
              Home
            </Link>
            <span>/</span>
            <Link href="/products" className="hover:text-navy">
              Tools
            </Link>
            <span>/</span>
            <span className="font-medium text-ink-primary">Fleet Calculator</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5 rounded-2xl bg-navy p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-verified/25 bg-verified/15 px-3 py-1 text-[10px] font-medium tracking-wide text-verified">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-verified" />
                Free Tool — No sign-in required
              </span>
              <h1 className="mb-2 text-[24px] font-medium leading-tight text-white sm:text-[28px]">
                Fleet Renewal Calculator
              </h1>
              <p className="max-w-lg text-[13px] leading-relaxed text-white/45">
                Model your exact IT refresh cost. Compare buying all-new vs Rentfoxxy-verified refurb laptops —
                adjust sliders to see live savings.
              </p>
            </div>
            <div className="hidden shrink-0 text-right lg:block">
              <p className="mb-1 text-[10px] uppercase tracking-widest text-white/30">Your current estimate</p>
              <p className="text-[32px] font-medium leading-none text-amber">{fmtLakh(savings)}</p>
              <p className="mt-1 text-[12px] text-white/40">saved vs buying new</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[400px_1fr]">
          <div className="h-fit space-y-5 rounded-2xl border border-border bg-white p-5 lg:sticky lg:top-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[11px] font-medium uppercase tracking-widest text-ink-muted">
                  Fleet size
                </label>
                <span className="text-[18px] font-medium text-ink-primary">
                  {fleetSize.toLocaleString("en-IN")} units
                </span>
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {[50, 100, 250, 500, 1000].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setFleetSize(n)}
                    className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all ${
                      fleetSize === n
                        ? "border-navy bg-navy text-white"
                        : "border-border text-ink-secondary hover:border-navy/40"
                    }`}
                  >
                    {n >= 1000 ? "1k" : n}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={10}
                max={2000}
                step={10}
                value={fleetSize}
                onChange={(e) => setFleetSize(Number(e.target.value))}
                className="w-full accent-navy"
              />
              <div className="mt-1 flex justify-between text-[10px] text-ink-muted">
                <span>10</span>
                <span>2,000 units</span>
              </div>
            </div>

            <div className="border-t border-border-light" />

            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-[11px] font-medium uppercase tracking-widest text-ink-muted">
                  Average fleet age
                </label>
                <span className="text-[18px] font-medium text-ink-primary">
                  {fleetAge} {fleetAge === 1 ? "year" : "years"}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={fleetAge}
                onChange={(e) => setFleetAge(Number(e.target.value))}
                className="w-full accent-navy"
              />
              <div className="mt-1 flex justify-between text-[10px] text-ink-muted">
                <span>1 yr</span>
                <span>10 yrs</span>
              </div>
              <div
                className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium ${
                  fleetAge <= 2
                    ? "bg-verified-bg text-verified-text"
                    : fleetAge >= 6
                      ? "bg-red-50 text-red-700"
                      : "bg-amber-bg text-amber-dark"
                }`}
              >
                {fleetAge <= 2 && "Healthy — selective refresh"}
                {fleetAge >= 3 && fleetAge <= 5 && "Approaching refresh"}
                {fleetAge >= 6 && "Urgent — full refresh recommended"}
              </div>
            </div>

            <div className="border-t border-border-light" />

            <div>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-widest text-ink-muted">
                Refurb grade to compare
              </label>
              <div className="mb-3 flex gap-2">
                {(Object.keys(FLEET_GRADE_CONFIG) as FleetGradeKey[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`flex-1 rounded-xl border py-2 text-[12px] font-medium transition-all ${
                      grade === g
                        ? g === "Refurb A+"
                          ? "border-lot bg-lot text-white"
                          : g === "Refurb A"
                            ? "border-asas bg-asas text-white"
                            : "border-amber-dark bg-amber-dark text-white"
                        : "border-border text-ink-secondary hover:border-navy/30"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div className="rounded-xl bg-surface p-3 text-[11px] leading-relaxed text-ink-secondary">
                <div className="mb-0.5 font-medium text-ink-primary">What you get with {grade}:</div>
                {cfg.desc}
                <div className="mt-1.5 flex flex-wrap gap-3 text-ink-muted">
                  <span>Warranty: {cfg.warranty}</span>
                  <span>Cosmetic: {cfg.cosmetic}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-navy p-6">
              <p className="mb-1 text-[10px] uppercase tracking-widest text-white/35">
                Estimated savings vs all-new
              </p>
              <div className="mb-1 flex flex-wrap items-baseline gap-3">
                <span className="text-[36px] font-medium text-amber">{fmtINR(savings)}</span>
                <span className="text-[13px] text-white/40">({savingsPct}% cheaper)</span>
              </div>
              <p className="mb-5 text-[12px] text-white/40">
                Switching {fleetSize.toLocaleString("en-IN")} units from all-new to {grade} refurb
              </p>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/10">
                <div className="bg-navy-light px-4 py-3">
                  <p className="mb-1 text-[10px] text-white/35">All new total</p>
                  <p className="text-[16px] font-medium text-white">{fmtINR(newTotal)}</p>
                </div>
                <div className="bg-navy-light px-4 py-3">
                  <p className="mb-1 text-[10px] text-white/35">Verified refurb total</p>
                  <p className="text-[16px] font-medium text-amber">{fmtINR(refurbTotal)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "Refurb price / unit", value: fmtINR(cfg.price), sub: grade, color: "text-lot" },
                { label: "New price / unit", value: fmtINR(NEW_PRICE), sub: "Brand New avg", color: "text-ink-primary" },
                {
                  label: "Saving / unit",
                  value: fmtINR(savePerUnit),
                  sub: `${savingsPct}% less`,
                  color: "text-verified-text",
                },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border bg-white p-4">
                  <p className="mb-1 text-[11px] text-ink-muted">{stat.label}</p>
                  <p className={`text-[18px] font-medium ${stat.color}`}>{stat.value}</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">{stat.sub}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-white p-5">
              <p className="mb-4 text-[13px] font-medium text-ink-primary">Cost comparison</p>
              <div className="mb-4">
                <div className="mb-1.5 flex justify-between text-[12px]">
                  <span className="flex items-center gap-1.5 text-ink-secondary">
                    All new
                    <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] text-ink-muted">
                      Brand New
                    </span>
                  </span>
                  <span className="font-medium text-ink-primary">{fmtINR(newTotal)}</span>
                </div>
                <div className="h-3 rounded-full bg-surface">
                  <div className="h-3 w-full rounded-full bg-navy" />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-[12px]">
                  <span className="flex items-center gap-1.5 text-ink-secondary">
                    Verified refurb
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] ${cfg.pillClass}`}>{grade}</span>
                  </span>
                  <span className="font-medium text-ink-primary">{fmtINR(refurbTotal)}</span>
                </div>
                <div className="h-3 rounded-full bg-surface">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{ width: `${refurbBarW}%`, background: cfg.barColor }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-ink-muted">{savingsPct}% less than buying all new</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-white p-5">
                <p className="mb-4 text-[13px] font-medium text-ink-primary">Recommended replacement timeline</p>
                <div>
                  {[
                    {
                      num: "1",
                      title: "Replace oldest 30%",
                      desc: "Start with units over 5 years old. Immediate productivity gain for high-usage staff.",
                      color: "bg-verified-bg text-verified-text",
                    },
                    {
                      num: "2",
                      title: "Mid-tier refresh",
                      desc: "Replace 3-5 year units in next quarter. Use Refurb A grade for cost balance.",
                      color: "bg-lot-bg text-lot-text",
                    },
                    {
                      num: "3",
                      title: "Full fleet standardisation",
                      desc: "Complete refresh by year-end. Standardise to 2 models for easier IT management.",
                      color: "bg-amber-bg text-amber-dark",
                    },
                  ].map((item, i) => (
                    <div
                      key={item.num}
                      className={`flex items-start gap-3 py-3 ${i < 2 ? "border-b border-border-light" : ""}`}
                    >
                      <div
                        className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-medium ${item.color}`}
                      >
                        {item.num}
                      </div>
                      <div>
                        <p className="text-[12px] font-medium text-ink-primary">{item.title}</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-secondary">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-white p-5">
                <p className="mb-4 text-[13px] font-medium text-ink-primary">Smart insights for your fleet</p>
                <div>
                  {[
                    { dot: "bg-verified", text: insight1 },
                    { dot: "bg-amber", text: insight2 },
                    { dot: "bg-lot", text: insight3 },
                  ].map((ins, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 py-3 ${i < 2 ? "border-b border-border-light" : ""}`}
                    >
                      <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${ins.dot}`} />
                      <p className="text-[12px] leading-relaxed text-ink-secondary">{ins.text}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-col gap-2 border-t border-border-light pt-4 sm:flex-row">
                  <Link
                    href={`/products?condition=${encodeURIComponent(grade)}`}
                    className="flex-1 rounded-xl bg-amber py-2.5 text-center text-[12px] font-semibold text-navy transition-colors hover:bg-amber-dark"
                  >
                    Browse {grade} →
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleDownload()}
                    disabled={downloading}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-[12px] font-medium text-ink-secondary transition-colors hover:border-navy/30 hover:text-navy disabled:opacity-50"
                  >
                    {downloading ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
                        Generating…
                      </>
                    ) : (
                      "Download PDF Report"
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-[11px] leading-relaxed text-ink-muted">
                Indicative estimates for planning purposes only. Actual prices vary by model, availability, and market
                conditions. GST 18% not included in comparisons above.
                <Link href="/contact" className="ml-1 text-lot hover:underline">
                  Talk to our team for a binding quote.
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
