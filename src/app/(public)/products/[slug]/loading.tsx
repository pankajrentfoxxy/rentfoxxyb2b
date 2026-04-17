import { SkeletonCard } from "@/components/ui/Skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-6 p-4">
      <div className="h-6 w-48 rounded bg-border" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <SkeletonCard />
        <div className="h-64 rounded-xl border border-border bg-card" />
      </div>
    </div>
  );
}
