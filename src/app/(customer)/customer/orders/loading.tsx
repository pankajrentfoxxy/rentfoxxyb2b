import { SkeletonTable } from "@/components/ui/Skeleton";

export default function CustomerOrdersLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <div className="h-8 w-40 animate-pulse rounded bg-border" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-20 animate-pulse rounded-full bg-border" />
        ))}
      </div>
      <SkeletonTable rows={8} />
    </div>
  );
}
