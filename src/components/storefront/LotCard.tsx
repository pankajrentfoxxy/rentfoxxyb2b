import { lotConditionToLabel } from "@/lib/lot-ai-cleaner";
import { cn } from "@/lib/utils";
import type { LotItemCondition } from "@prisma/client";
import Link from "next/link";

export interface LotCardProps {
  id: string;
  title: string;
  description?: string | null;
  brands: string[];
  conditions: LotItemCondition[];
  totalLots: number;
  lotsSold: number;
  lotsRemaining: number;
  lotSize: number;
  pricePerLot: number;
  percentSold: number;
}

function conditionChipClass(label: string): string {
  const map: Record<string, string> = {
    "Brand New": "bg-green-100 text-green-700",
    "Refurb A+": "bg-blue-100 text-blue-700",
    "Refurb A": "bg-purple-100 text-purple-700",
    "Refurb B": "bg-yellow-100 text-yellow-700",
    "Refurb C": "bg-red-100 text-red-700",
  };
  return map[label] ?? "bg-slate-100 text-slate-700";
}

export function LotCard({
  id,
  title,
  description,
  brands,
  conditions,
  totalLots,
  lotsSold,
  lotsRemaining,
  lotSize,
  pricePerLot,
  percentSold,
}: LotCardProps) {
  const urgency = percentSold >= 90 ? "critical" : percentSold >= 70 ? "high" : "normal";
  const perUnit = lotSize > 0 ? Math.round(pricePerLot / lotSize) : 0;

  return (
    <Link
      href={`/sales/lots/${id}`}
      className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:border-accent hover:shadow-xl"
    >
      {urgency === "critical" ? (
        <div className="absolute left-0 right-0 top-0 z-10 bg-red-500 py-1.5 text-center text-xs font-bold text-white">
          Almost sold out — {lotsRemaining} lots left
        </div>
      ) : null}
      <div
        className={cn(
          "border-b border-slate-100 bg-gradient-to-br from-primary/8 to-accent/8 px-4 pb-3",
          urgency === "critical" ? "pt-8" : "pt-4",
        )}
      >
        <div className="mb-2 flex flex-wrap gap-1">
          {brands.map((b) => (
            <span key={b} className="rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-white">
              {b}
            </span>
          ))}
        </div>
        <h3 className="mb-1 line-clamp-2 text-sm font-bold leading-snug text-primary transition-colors group-hover:text-accent">
          {title}
        </h3>
        {description ? <p className="line-clamp-1 text-xs text-muted">{description}</p> : null}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-1">
          {conditions.map((c, i) => {
            const label = lotConditionToLabel(c);
            return (
              <span key={`${c}-${i}`} className={cn("rounded-full px-2 py-0.5 text-xs font-medium", conditionChipClass(label))}>
                {label}
              </span>
            );
          })}
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-primary">
              {lotsSold} / {totalLots} lots sold
            </span>
            <span
              className={cn(
                "text-xs font-bold",
                urgency === "critical" && "animate-pulse text-red-600",
                urgency === "high" && "text-amber-600",
                urgency === "normal" && "text-emerald-600",
              )}
            >
              {lotsRemaining} left
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                "h-2.5 rounded-full transition-all duration-500",
                urgency === "critical" && "bg-red-500",
                urgency === "high" && "bg-amber-500",
                urgency === "normal" && "bg-gradient-to-r from-accent to-primary",
              )}
              style={{ width: `${Math.min(100, percentSold)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted">
            Each lot = {lotSize} units · {percentSold}% sold
          </p>
        </div>
        <div className="flex items-end justify-between border-t border-slate-100 pt-1">
          <div>
            <p className="text-xs text-muted">Price per lot</p>
            <p className="text-xl font-bold text-primary">₹{pricePerLot.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted">≈ ₹{perUnit.toLocaleString("en-IN")}/unit</p>
          </div>
          <span className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white transition-colors group-hover:bg-primary">
            View lot →
          </span>
        </div>
      </div>
    </Link>
  );
}
