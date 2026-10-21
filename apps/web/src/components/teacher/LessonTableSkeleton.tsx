import { Skeleton } from "@/components/ui/skeleton";

type LessonTableSkeletonProps = {
  pendingLabel: string;
};

export const LessonTableSkeleton = ({ pendingLabel }: LessonTableSkeletonProps) => (
  <div className="min-w-0 max-w-full space-y-6" aria-busy="true" aria-label={pendingLabel}>
    <div className="space-y-2">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-full max-w-md" />
    </div>
    <Skeleton className="h-96 w-full rounded-xl" />
  </div>
);
