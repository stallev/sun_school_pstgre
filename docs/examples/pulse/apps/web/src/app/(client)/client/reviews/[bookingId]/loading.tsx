import { Skeleton } from "@/components/ui/skeleton";

export default function ClientReviewLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 py-4 pb-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}
