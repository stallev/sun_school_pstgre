import { PulseCard } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrainerServicesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <PulseCard key={index} className="space-y-3 p-4 md:p-5">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-24" />
            </div>
          </PulseCard>
        ))}
      </div>
    </div>
  );
}
