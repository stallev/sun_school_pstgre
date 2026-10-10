import { PulseCard, PulseCardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TrainerApplicationDetailSkeleton() {
  return (
    <div aria-busy="true" className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-8 w-56" />
      </div>

      <PulseCard variant="base" className="rounded-2xl">
        <PulseCardContent density="sm" className="space-y-4">
          <div className="flex items-start gap-3">
            <Skeleton className="size-12 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <div className="flex gap-1 pt-0.5">
                <Skeleton className="h-6 w-14 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="grid gap-3 md:max-w-xl">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-12 w-full" />
        </PulseCardContent>
      </PulseCard>

      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <PulseCard variant="compact" className="rounded-2xl ring-1 ring-border">
          <PulseCardContent density="sm" className="space-y-2">
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </PulseCardContent>
        </PulseCard>
      </div>

      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-11 w-28 rounded-md" />
        <Skeleton className="h-11 w-32 rounded-md" />
      </div>
    </div>
  );
}
