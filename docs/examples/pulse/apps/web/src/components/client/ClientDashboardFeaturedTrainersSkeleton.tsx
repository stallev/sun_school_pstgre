import { Skeleton } from "@/components/ui/skeleton";

export function ClientDashboardFeaturedTrainersSkeleton() {
  return (
    <section className="space-y-3" aria-hidden>
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-2.5 lg:grid-cols-2">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="hidden h-32 w-full rounded-2xl lg:block" />
        <Skeleton className="hidden h-32 w-full rounded-2xl lg:block" />
      </div>
    </section>
  );
}
