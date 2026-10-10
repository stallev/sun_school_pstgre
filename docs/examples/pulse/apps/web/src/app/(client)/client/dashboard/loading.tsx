import { Skeleton } from "@/components/ui/skeleton";

export default function ClientDashboardLoading() {
  return (
    <div className="space-y-6 pb-6">
      <Skeleton className="h-16 w-64" />
      <Skeleton className="h-14 w-full rounded-full" />

      <div className="min-w-0 space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          </div>
        </div>

        <aside className="min-w-0 space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-3 gap-2.5 lg:grid-cols-2">
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <Skeleton className="aspect-square w-full rounded-2xl" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
