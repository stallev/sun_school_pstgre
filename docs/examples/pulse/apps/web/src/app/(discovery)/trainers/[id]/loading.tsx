import { Skeleton } from "@/components/ui/skeleton";
import { TrainerSchedulePreviewSkeleton } from "@/components/trainer/TrainerSchedulePreviewSkeleton";

export default function TrainerProfileLoading() {
  return (
    <div className="space-y-4 pb-28 md:pb-8">
      <div className="-mx-4 md:mx-0 lg:flex lg:items-start lg:gap-6">
        <Skeleton className="mx-auto aspect-[3/4] w-full max-w-[360px] rounded-none lg:mx-0 lg:w-72 lg:max-w-none lg:shrink-0 lg:rounded-3xl" />
        <Skeleton className="-mt-6 h-40 flex-1 rounded-2xl md:mt-4 lg:mt-0" />
      </div>
      <Skeleton className="h-10 w-full max-w-md rounded-full" />
      <TrainerSchedulePreviewSkeleton />
    </div>
  );
}
