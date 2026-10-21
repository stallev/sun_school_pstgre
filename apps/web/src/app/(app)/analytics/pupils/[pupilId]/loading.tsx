import { Skeleton } from "@/components/ui/skeleton";

const PupilAnalyticsLoading = () => (
  <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden" aria-busy="true">
    <Skeleton className="h-10 w-64" />
    <Skeleton className="h-5 w-48" />
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-11 w-28 rounded-lg" />
      ))}
    </div>
    <Skeleton className="h-48 w-full rounded-xl" />
    <Skeleton className="h-56 w-full rounded-xl" />
    <Skeleton className="h-14 w-full max-w-xl rounded-lg" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-xl" />
      ))}
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-64 w-full rounded-xl" />
      ))}
    </div>
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
);

export default PupilAnalyticsLoading;
