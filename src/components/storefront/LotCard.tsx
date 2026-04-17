import { BTN } from "@/constants/design";
import { cn } from "@/lib/utils";
import { ConditionBadge } from "@/components/ui/ConditionBadge";
import { LotProgress } from "@/components/ui/StatBadge";
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
  const perUnit = lotSize > 0 ? Math.round(pricePerLot / lotSize) : 0;
  const showUrgency = percentSold > 70;

  return (
    <Link
      href={`/sales/lots/${id}`}
      className="group relative block overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-lot/40 hover:shadow-md"
    >
      <div className="border-l-[3px] border-l-amber">
        <div className="bg-navy-light px-4 py-3">
          <div className="mb-2 flex flex-wrap items-center gap-1">
            {brands.map((b) => (
              <span key={b} className="rounded bg-white/15 px-2 py-0.5 text-[9px] font-medium text-white">
                {b}
              </span>
            ))}
            {showUrgency ? (
              <span className="rounded bg-red-500/15 px-2 py-0.5 text-[9px] font-medium text-red-300">
                High demand
              </span>
            ) : null}
          </div>
          <h3 className="mb-1 line-clamp-2 text-[13px] font-medium leading-snug text-white">{title}</h3>
          {description ? (
            <p className="line-clamp-1 text-[11px] text-white/40">{description}</p>
          ) : null}
        </div>

        <div className="space-y-3 px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {conditions.map((c, i) => (
              <ConditionBadge key={`${String(c)}-${i}`} condition={String(c)} size="sm" />
            ))}
          </div>
          <LotProgress sold={lotsSold} total={totalLots} />
          <span className="sr-only">{lotsRemaining} lots remaining</span>
          <p className="text-[9px] text-ink-muted">{lotSize} units per lot</p>
          <div className="flex items-end justify-between border-t border-border-light pt-3">
            <div>
              <p className="text-[17px] font-medium text-ink-primary">₹{pricePerLot.toLocaleString("en-IN")}</p>
              <p className="text-[9px] text-ink-muted">per lot</p>
              <p className="text-[9px] text-ink-muted">≈ ₹{perUnit.toLocaleString("en-IN")}/unit</p>
            </div>
            <span
              className={cn(
                BTN.navy,
                "px-3 py-1.5 text-[10px] hover:bg-navy-light",
              )}
            >
              View Lot →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
