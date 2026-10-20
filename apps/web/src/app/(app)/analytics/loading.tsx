import { Skeleton } from "@/components/ui/skeleton";

const AnalyticsLoading = () => (
  <div className="space-y-6" aria-busy="true">
    <Skeleton className="h-10 w-64" />
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-11 w-28 rounded-lg" />
      ))}
    </div>
    <Skeleton className="h-48 w-full rounded-xl" />
    <Skeleton className="h-14 w-full max-w-xl rounded-lg" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-xl" />
      ))}
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-64 w-full rounded-xl" />
      ))}
    </div>
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
);

export default AnalyticsLoading;
