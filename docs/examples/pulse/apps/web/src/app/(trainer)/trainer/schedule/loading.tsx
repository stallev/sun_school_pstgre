import { PulseCard } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrainerScheduleLoading() {
  return (
    <div className="space-y-6 md:max-w-4xl">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-10 w-full" />
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <PulseCard key={index} className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-7 w-12 rounded-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-24 rounded-xl" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
          </PulseCard>
        ))}
      </div>
    </div>
  );
}
