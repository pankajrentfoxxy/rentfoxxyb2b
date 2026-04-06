import { lotConditionToLabel } from "@/lib/lot-ai-cleaner";
import type { LotItemCondition } from "@prisma/client";
import Link from "next/link";

export interface LotCardProps {
  id: string;
  title: string;
  coverImage?: string | null;
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
    "Brand New": "bg-green-100 text-green-800",
    "Refurb A+": "bg-blue-100 text-blue-800",
    "Refurb A": "bg-purple-100 text-purple-800",
    "Refurb B": "bg-yellow-100 text-yellow-800",
    "Refurb C": "bg-red-100 text-red-800",
  };
  return map[label] ?? "bg-slate-100 text-slate-700";
}

export function LotCard({
  id,
  title,
  brands,
  conditions,
  totalLots,
  lotsSold,
  lotsRemaining,
  lotSize,
  pricePerLot,
  percentSold,
}: LotCardProps) {
  return (
    <Link
      href={`/sales/lots/${id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:border-accent hover:shadow-lg"
    >
      <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-orange-100/60 to-accent/10">
        <div className="flex flex-wrap justify-center gap-2 px-4">
          {brands.map((b) => (
            <span
              key={b}
              className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-primary shadow-sm"
            >
              {b}
            </span>
          ))}
        </div>
        {percentSold > 70 ? (
          <div className="absolute right-3 top-3 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
            Almost gone
          </div>
        ) : null}
      </div>
      <div className="space-y-3 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-primary transition-colors group-hover:text-accent">
          {title}
        </h3>
        <div className="flex flex-wrap gap-1">
          {conditions.map((c, i) => {
            const label = lotConditionToLabel(c);
            return (
              <span
                key={`${c}-${i}`}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${conditionChipClass(label)}`}
              >
                {label}
              </span>
            );
          })}
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>
              {lotsSold}/{totalLots} lots sold
            </span>
            <span>{lotsRemaining} left</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-accent to-primary transition-all"
              style={{ width: `${percentSold}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-primary">₹{pricePerLot.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted">
              per lot ({lotSize} units)
            </p>
          </div>

          <span className="rounded-xl bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-colors group-hover:bg-accent group-hover:text-white">
            View lot →
          </span>
        </div>
      </div>
    </Link>
  );
}
