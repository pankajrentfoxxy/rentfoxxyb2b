import { BTN } from "@/constants/design";
import { cn } from "@/lib/utils";
import { ConditionBadge } from "@/components/ui/ConditionBadge";
import { LotProgress } from "@/components/ui/StatBadge";
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
  lotSize,
}: AsAsCardProps) {
  return (
    <Link
      href={`/asas/listings/${id}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-asas/30 hover:shadow-md"
    >
      <div className="border-l-[3px] border-l-asas">
        <div className="bg-[#3B0764] px-4 py-3">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-white/12 px-2 py-0.5 text-[9px] font-medium text-white">🔄 AsAs</span>
            {allowBidding ? (
              <span className="rounded bg-asas/30 px-2 py-0.5 text-[9px] font-medium text-purple-200">
                Bid open
              </span>
            ) : null}
          </div>
          <h3 className="mb-1 line-clamp-2 text-[13px] font-medium leading-snug text-white">{title}</h3>
          {brands.length ? (
            <p className="mb-1 text-[11px] text-white/35">{brands.slice(0, 4).join(" · ")}</p>
          ) : null}
          {description ? (
            <p className="line-clamp-1 text-[11px] text-white/35">{description}</p>
          ) : null}
        </div>

        <div className="space-y-3 px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {conditions.map((c, i) => (
              <ConditionBadge key={`${String(c)}-${i}`} condition={String(c)} size="sm" />
            ))}
          </div>
          {isLotMode && totalLots ? (
            <>
              <LotProgress sold={lotsSold ?? 0} total={totalLots} />
              {lotSize ? <p className="text-[9px] text-ink-muted">~{lotSize} units per lot</p> : null}
            </>
          ) : (
            <p className="text-sm text-ink-secondary">
              <span className="font-semibold text-ink-primary">{unitsAvailable}</span> units available
            </p>
          )}
          <div className="flex items-end justify-between border-t border-border-light pt-3">
            <div>
              <p className="text-[17px] font-medium text-asas">
                ₹{avgUnitPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
              <p className="text-[9px] text-ink-muted">avg / unit</p>
            </div>
            <span className={cn(BTN.asas, "px-3 py-1.5 text-[10px]")}>View Deal →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
