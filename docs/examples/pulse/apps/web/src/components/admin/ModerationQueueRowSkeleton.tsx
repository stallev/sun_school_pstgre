import { PulseCard, PulseCardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ModerationQueueRowSkeleton() {
  return (
    <PulseCard variant="base" className="h-full rounded-2xl">
      <PulseCardContent density="sm" className="space-y-3">
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <div className="flex gap-1 pt-0.5">
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
          <Skeleton className="size-4 shrink-0 rounded-sm" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-24" />
        </div>
      </PulseCardContent>
    </PulseCard>
  );
}
