import { SkeletonTable } from "@/components/ui/Skeleton";

export default function CustomerBidsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <div className="h-8 w-48 animate-pulse rounded bg-border" />
      <SkeletonTable rows={6} />
    </div>
  );
}
