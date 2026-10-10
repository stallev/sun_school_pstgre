import { Skeleton } from "@/components/ui/skeleton";

export function TrainerProfileTabsSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <Skeleton className="h-10 w-full max-w-md rounded-full" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}
