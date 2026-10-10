import { Heading } from "@/components/atoms";
import { Skeleton } from "@/components/ui/skeleton";
import { getMessages } from "@/lib/messages/server";

export default async function TrainerDashboardLoading() {
  const messages = await getMessages();

  return (
    <>
      <Heading as="h1" visualLevel="h3">
        {messages.dashboard.trainerTitle}
      </Heading>
      <div className="mt-6 space-y-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    </>
  );
}
