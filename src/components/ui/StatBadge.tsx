interface Props {
  sold: number;
  total: number;
}

/** Progress bar for lot / AsAs cards (Addendum v1.7). */
export function LotProgress({ sold, total }: Props) {
  const pct = total > 0 ? Math.round((sold / total) * 100) : 0;
  const barColor = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber" : "bg-lot";
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] text-ink-muted">
        <span>
          {sold} / {total} lots sold
        </span>
        <span
          className={pct >= 70 ? "font-medium text-red-600" : "font-medium text-verified-text"}
        >
          {total - sold} left
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-border-light">
        <div
          className={`h-1.5 rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
