import { Skeleton } from "@/components/ui/skeleton";

export function TrainerSchedulePreviewSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-14 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {Array.from({ length: 9 }).map((_, index) => (
          <Skeleton key={index} className="h-10 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
