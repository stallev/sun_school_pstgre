import { PulseCard } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrainerProfileLoading() {
  return (
    <div className="space-y-6 md:max-w-2xl">
      <Skeleton className="h-9 w-40" />
      <PulseCard className="space-y-4 p-4 md:p-6">
        <Skeleton className="size-24 rounded-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-11 w-36" />
      </PulseCard>
    </div>
  );
}
