import { BookingListSkeleton } from "@/components/booking/BookingListSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientBookingsLoading() {
  return (
    <div className="space-y-4 pb-6 md:max-w-5xl">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-10 w-full max-w-md rounded-full" />
      <BookingListSkeleton />
    </div>
  );
}
