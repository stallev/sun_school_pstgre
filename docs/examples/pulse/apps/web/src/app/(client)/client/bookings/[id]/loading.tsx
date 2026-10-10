import { Skeleton } from "@/components/ui/skeleton";

export default function ClientBookingDetailLoading() {
  return (
    <div className="space-y-6 py-4">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-56 w-full rounded-2xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}
