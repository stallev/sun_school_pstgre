import { Skeleton } from "@/components/ui/skeleton";

export function TrainerProfileReviewsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-24" />
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
