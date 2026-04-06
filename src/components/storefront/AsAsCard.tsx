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
}: AsAsCardProps) {
  return (
    <Link
      href={`/asas/listings/${id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:border-purple-400 hover:shadow-lg"
    >
      <div className="flex h-32 flex-col items-center justify-center gap-2 bg-gradient-to-br from-purple-50 to-indigo-50 px-4">
        <div className="flex flex-wrap justify-center gap-2">
          {brands.map((b) => (
            <span
              key={b}
              className="rounded-full bg-white px-3 py-1 text-xs font-bold text-purple-800 shadow-sm"
            >
              {b}
            </span>
          ))}
        </div>
        {allowBidding ? (
          <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white">
            Bidding available
          </span>
        ) : null}
      </div>
      <div className="space-y-3 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-primary transition-colors group-hover:text-purple-700">
          {title}
        </h3>
        {description ? <p className="line-clamp-2 text-xs text-muted">{description}</p> : null}
        <div className="flex flex-wrap gap-1">
          {conditions.map((c, i) => (
            <span
              key={`${c}-${i}`}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
            >
              {lotConditionToLabel(c)}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-primary">
              ~₹{avgUnitPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted">{unitsAvailable} units available</p>
          </div>
          <span className="rounded-xl bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-700 transition-colors group-hover:bg-purple-600 group-hover:text-white">
            View deal →
          </span>
        </div>
      </div>
    </Link>
  );
}
