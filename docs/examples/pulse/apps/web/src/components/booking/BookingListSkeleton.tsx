import { Skeleton } from "@/components/ui/skeleton";

export function BookingListSkeleton() {
  return (
    <div className="grid grid-cols-1 items-stretch gap-2.5 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-2xl" />
      ))}
    </div>
  );
}
