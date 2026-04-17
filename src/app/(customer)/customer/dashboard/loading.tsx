export default function CustomerDashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-8 p-4">
      <div className="h-8 w-56 rounded bg-border" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-border bg-white" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-xl border border-border bg-white" />
        <div className="h-64 rounded-xl border border-border bg-white" />
      </div>
    </div>
  );
}
