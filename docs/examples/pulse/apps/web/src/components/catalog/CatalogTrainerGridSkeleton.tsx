import { PulseCard } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function CatalogTrainerCardSkeleton() {
  return (
    <PulseCard variant="catalog" className="h-full min-w-0">
      <div className="flex h-full gap-3 p-3 md:min-h-[7.5rem]">
        <Skeleton className="size-24 shrink-0 rounded-2xl" />
        <div className="flex min-w-0 flex-1 flex-col space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
          <div className="mt-auto flex gap-2 pt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </PulseCard>
  );
}

export function CatalogTrainerGridSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading trainers"
      className="grid grid-cols-1 items-stretch gap-2.5 lg:grid-cols-2"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="h-full min-w-0">
          <CatalogTrainerCardSkeleton />
        </div>
      ))}
    </div>
  );
}
