import { lotConditionToLabel } from "@/lib/lot-ai-cleaner";
import type { LotItemCondition } from "@prisma/client";
import Link from "next/link";

export interface AsAsCardProps {
  id: string;
  title: string;
  description?: string | null;
  brands: string[];
  conditions: LotItemCondition[];
  unitsAvailable: number;
  avgUnitPrice: number;
  allowBidding: boolean;
  isLotMode?: boolean;
  totalLots?: number | null;
  lotsSold?: number | null;
  lotsRemaining?: number | null;
  lotSize?: number | null;
  percentSold?: number;
}

export function AsAsCard({
  id,
  title,
  description,
  brands,
  conditions,
  unitsAvailable,
  avgUnitPrice,
  allowBidding,
  isLotMode,
  totalLots,
  lotsSold,
  lotsRemaining,
  lotSize,
  percentSold,
}: AsAsCardProps) {
  const pct =
    percentSold ??
    (isLotMode && totalLots && lotsSold != null
      ? Math.round((lotsSold / totalLots) * 100)
      : undefined);

  return (
    <Link
      href={`/asas/listings/${id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:border-purple-400 hover:shadow-xl"
    >
      <div className="border-b border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50 px-4 pb-3 pt-4">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {brands.map((b) => (
            <span key={b} className="rounded-lg bg-purple-700 px-2.5 py-1 text-xs font-bold text-white">
              {b}
            </span>
          ))}
          {allowBidding ? (
            <span className="rounded-lg bg-amber-500 px-2 py-1 text-xs font-semibold text-white">Bid</span>
          ) : null}
        </div>
        <h3 className="mb-1 line-clamp-2 text-sm font-bold leading-snug text-primary transition-colors group-hover:text-purple-700">
          {title}
        </h3>
        {description ? <p className="line-clamp-1 text-xs text-muted">{description}</p> : null}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-1">
          {conditions.map((c, i) => (
            <span key={`${c}-${i}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {lotConditionToLabel(c)}
            </span>
          ))}
        </div>
        {isLotMode && totalLots ? (
          <div>
            <div className="mb-1.5 flex justify-between">
              <span className="text-xs font-semibold text-primary">
                {lotsSold ?? 0} / {totalLots} lots sold
              </span>
              <span className="text-xs font-bold text-purple-600">{lotsRemaining ?? 0} remaining</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600"
                style={{ width: `${Math.min(100, pct ?? 0)}%` }}
              />
            </div>
            {lotSize ? <p className="mt-1 text-xs text-muted">Each lot ≈ {lotSize} units</p> : null}
          </div>
        ) : (
          <div className="text-sm">
            <span className="font-bold text-primary">{unitsAvailable}</span>
            <span className="text-muted"> units available</span>
          </div>
        )}
        <div className="flex items-end justify-between border-t border-slate-100 pt-1">
          <div>
            <p className="text-xs text-muted">Avg. price / unit</p>
            <p className="text-xl font-bold text-primary">
              ₹{avgUnitPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
          </div>
          <span className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white transition-colors group-hover:bg-purple-700">
            View deal →
          </span>
        </div>
      </div>
    </Link>
  );
}
