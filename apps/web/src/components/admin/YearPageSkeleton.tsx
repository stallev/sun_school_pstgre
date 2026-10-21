import { Skeleton } from "@/components/ui/skeleton";

type YearPageSkeletonProps = {
  pendingLabel: string;
};

export const YearPageSkeleton = ({ pendingLabel }: YearPageSkeletonProps) => (
  <div className="min-w-0 max-w-full space-y-6" aria-busy="true" aria-label={pendingLabel}>
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-36 w-full rounded-xl" />
    <div className="grid items-stretch gap-4 lg:grid-cols-2">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  </div>
);
