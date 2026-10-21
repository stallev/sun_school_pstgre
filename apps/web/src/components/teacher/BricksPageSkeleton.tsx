import { Skeleton } from "@/components/ui/skeleton";

type BricksPageSkeletonProps = {
  pendingLabel: string;
};

export const BricksPageSkeleton = ({ pendingLabel }: BricksPageSkeletonProps) => (
  <div className="min-w-0 max-w-full space-y-6" aria-busy="true" aria-label={pendingLabel}>
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full max-w-lg" />
    </div>
    <Skeleton className="h-16 w-full rounded-xl" />
    <Skeleton className="h-28 w-full rounded-xl" />
    <Skeleton className="h-28 w-full rounded-xl" />
  </div>
);
