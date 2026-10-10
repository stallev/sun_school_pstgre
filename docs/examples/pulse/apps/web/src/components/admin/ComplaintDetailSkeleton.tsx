import { PulseCard, PulseCardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ComplaintDetailSkeleton() {
  return (
    <div aria-busy="true" className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>

      <PulseCard variant="base" className="rounded-2xl">
        <PulseCardContent density="sm" className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-5 w-full" />
          <div className="grid gap-3 md:max-w-xl">
            <Skeleton className="h-4 w-1/2" />
          </div>
        </PulseCardContent>
      </PulseCard>

      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-11 w-28 rounded-md" />
        <Skeleton className="h-11 w-36 rounded-md" />
      </div>
    </div>
  );
}
