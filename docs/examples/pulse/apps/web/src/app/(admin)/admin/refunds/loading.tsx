import { AdminQueueGridSkeleton } from "@/components/admin/AdminQueueGridSkeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { getMessages } from "@/lib/messages/server";


export default async function AdminRefundsLoading() {
  const messages = await getMessages();
  return (
    <>
      <PageHeader title={messages.admin.refunds.title} />
      <div className="mt-6 space-y-6">
        <Skeleton className="h-4 w-full max-w-lg" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <AdminQueueGridSkeleton count={2} />
      </div>
    </>
  );
}
