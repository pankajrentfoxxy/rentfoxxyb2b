/** v1.7 P8 loading placeholders */
export function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-border bg-card">
      <div className="h-24 bg-navy-light" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-3/4 rounded bg-border" />
        <div className="h-3 w-1/2 rounded bg-border" />
        <div className="mt-3 h-2 w-full rounded bg-border" />
        <div className="mt-3 flex justify-between">
          <div className="h-5 w-1/3 rounded bg-border" />
          <div className="h-6 w-1/4 rounded bg-border" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-border bg-card">
      <div className="h-10 bg-surface" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-border-light px-4 py-3 last:border-0">
          <div className="h-3 flex-1 rounded bg-border" />
          <div className="h-3 w-1/4 rounded bg-border" />
          <div className="h-3 w-1/6 rounded bg-border" />
        </div>
      ))}
    </div>
  );
}
