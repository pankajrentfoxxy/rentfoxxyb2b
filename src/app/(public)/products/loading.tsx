import { SkeletonCard } from "@/components/ui/Skeleton";

export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <div className="h-10 max-w-md animate-pulse rounded-lg bg-border" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
