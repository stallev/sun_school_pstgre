import { Skeleton } from "@/components/ui/skeleton";

type AnalyticsPageSkeletonProps = {
  pendingLabel: string;
};

export const AnalyticsPageSkeleton = ({ pendingLabel }: AnalyticsPageSkeletonProps) => (
  <div className="min-w-0 max-w-full space-y-6" aria-busy="true" aria-label={pendingLabel}>
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full max-w-lg" />
    </div>
    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-11 w-28 rounded-lg" />
      <Skeleton className="h-11 w-28 rounded-lg" />
      <Skeleton className="h-11 w-28 rounded-lg" />
    </div>
    <Skeleton className="h-48 w-full rounded-xl" />
    <Skeleton className="h-64 w-full rounded-xl" />
  </div>
);
