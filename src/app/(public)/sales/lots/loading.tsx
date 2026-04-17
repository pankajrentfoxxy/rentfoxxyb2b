import { SkeletonCard } from "@/components/ui/Skeleton";

export default function LotsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <div className="h-24 rounded-lg bg-navy/20" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
