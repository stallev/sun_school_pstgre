import { Skeleton } from "@/components/ui/skeleton";

/** Desktop sidebar placeholder — pair with results-column siblings. */
export function CatalogFiltersChromeSkeleton() {
  return (
    <div className="hidden space-y-4 lg:block">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
