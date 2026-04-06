export function LotDetailSkeleton() {
  return (
    <div className="min-h-screen animate-pulse bg-slate-50/80">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="h-4 w-64 rounded bg-slate-200" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="h-64 rounded-2xl bg-slate-200" />
            <div className="h-96 rounded-2xl bg-slate-200" />
          </div>
          <div className="h-[480px] rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
