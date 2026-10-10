import { Skeleton } from "@/components/ui/skeleton";

export function TrainerProfileDetailsSkeleton() {
  return (
    <div className="md:grid md:grid-cols-[minmax(0,1fr)_360px] md:items-start md:gap-6">
      <div className="min-w-0 space-y-4">
        <Skeleton className="h-10 w-full max-w-md rounded-full" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
      <Skeleton className="hidden h-72 w-full rounded-2xl md:block" />
    </div>
  );
}
