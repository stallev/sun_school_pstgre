import { Skeleton } from "@/components/ui/skeleton";

export function CatalogResultsToolbarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-11 flex-1 rounded-full" />
        <Skeleton className="h-11 w-28 rounded-full lg:hidden" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}
