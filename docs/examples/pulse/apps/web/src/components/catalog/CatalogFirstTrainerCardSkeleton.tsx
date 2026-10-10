import { CatalogTrainerCardSkeleton } from "@/components/catalog/CatalogTrainerGridSkeleton";

export function CatalogFirstTrainerCardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading trainers"
      className="grid grid-cols-1 items-stretch gap-2.5 lg:grid-cols-2"
    >
      <div className="h-full min-w-0">
        <CatalogTrainerCardSkeleton />
      </div>
    </div>
  );
}
