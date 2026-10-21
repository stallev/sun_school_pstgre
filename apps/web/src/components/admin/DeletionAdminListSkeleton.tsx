import { Skeleton } from "@/components/ui/skeleton";

type DeletionAdminListSkeletonProps = {
  pendingLabel: string;
};

export const DeletionAdminListSkeleton = ({ pendingLabel }: DeletionAdminListSkeletonProps) => (
  <div className="min-w-0 max-w-full space-y-6" aria-busy="true" aria-label={pendingLabel}>
    <div className="space-y-2">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-full max-w-lg" />
    </div>
    <div className="flex gap-2 border-b border-line pb-2">
      <Skeleton className="h-11 w-24 rounded-lg" />
      <Skeleton className="h-11 w-28 rounded-lg" />
      <Skeleton className="h-11 w-28 rounded-lg" />
    </div>
    <Skeleton className="h-28 w-full rounded-xl" />
    <Skeleton className="h-28 w-full rounded-xl" />
  </div>
);
