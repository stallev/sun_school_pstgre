import { Skeleton } from "@/components/ui/skeleton";

export function BookingWizardSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <Skeleton className="h-14 w-full rounded-none" />
      <Skeleton className="h-8 w-40" />
      <div className="space-y-2.5">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    </div>
  );
}
