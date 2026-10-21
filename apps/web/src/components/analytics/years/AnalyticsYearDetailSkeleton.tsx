import { Skeleton } from "@/components/ui/skeleton";

export const AnalyticsYearDetailSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-36 w-full rounded-xl" />
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-64 w-full rounded-xl" />
      ))}
    </div>
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
);
