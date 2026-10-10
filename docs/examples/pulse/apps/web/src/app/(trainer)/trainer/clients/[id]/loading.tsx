import { PulseCard } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrainerClientDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-36" />
        {Array.from({ length: 3 }).map((_, index) => (
          <PulseCard key={index} className="space-y-2 p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </PulseCard>
        ))}
      </div>
    </div>
  );
}
