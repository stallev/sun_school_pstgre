import { Skeleton } from "@/components/ui/skeleton";

export function ClientNextSessionSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-44 w-full rounded-2xl" />
    </div>
  );
}
