import { ModerationQueueRowSkeleton } from "@/components/admin/ModerationQueueRowSkeleton";
import { getMessages } from "@/lib/messages/server";

import { cn } from "@/lib/utils";

export type TrainerApplicationsGridSkeletonProps = {
  className?: string;
};

export async function TrainerApplicationsGridSkeleton({  className,
}: TrainerApplicationsGridSkeletonProps) {
  const messages = await getMessages();

  return (
    <div
      aria-busy="true"
      aria-label={messages.admin.moderation.loadingQueue}
      className={cn(
        "mt-6 grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3",
        className,
      )}
    >
      {Array.from({ length: 6 }, (_, index) => (
        <ModerationQueueRowSkeleton key={index} />
      ))}
    </div>
  );
}
