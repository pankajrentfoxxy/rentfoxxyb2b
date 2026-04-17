import { CONDITION_BADGE } from "@/constants/design";
import { lotConditionToLabel } from "@/lib/lot-ai-cleaner";

interface Props {
  condition: string;
  size?: "sm" | "md";
}

export function ConditionBadge({ condition, size = "md" }: Props) {
  const label = lotConditionToLabel(condition);
  const cfg =
    CONDITION_BADGE[label as keyof typeof CONDITION_BADGE] ??
    ({
      bg: "bg-gray-100",
      text: "text-gray-700",
      dot: "bg-gray-400",
      label,
    } as const);
  const sizeClass = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded ${sizeClass} ${cfg.bg} ${cfg.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
