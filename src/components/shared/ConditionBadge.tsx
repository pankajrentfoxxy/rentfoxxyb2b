import { lotConditionToLabel } from "@/lib/lot-ai-cleaner";
import type { LotItemCondition } from "@prisma/client";
import { cn } from "@/lib/utils";

const LABEL_TO_CLASS: Record<string, string> = {
  "Brand New": "bg-green-100 text-green-800",
  "Refurb A+": "bg-blue-100 text-blue-800",
  "Refurb A": "bg-purple-100 text-purple-800",
  "Refurb B": "bg-yellow-100 text-yellow-800",
  "Refurb C": "bg-red-100 text-red-800",
};

export function ConditionBadge({
  condition,
  className,
}: {
  condition: LotItemCondition | string;
  className?: string;
}) {
  const label = lotConditionToLabel(condition);
  const cls = LABEL_TO_CLASS[label] ?? "bg-slate-100 text-slate-700";
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        cls,
        className,
      )}
    >
      {label}
    </span>
  );
}
