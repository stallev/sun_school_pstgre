import { AdminQueueGridSkeleton } from "@/components/admin/AdminQueueGridSkeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { getMessages } from "@/lib/messages/server";


export default async function AdminComplaintsLoading() {
  const messages = await getMessages();
  return (
    <>
      <PageHeader title={messages.admin.complaints.title} />
      <div className="mt-6">
        <Skeleton className="h-10 w-full max-w-md rounded-full" />
        <AdminQueueGridSkeleton count={4} className="mt-4" />
      </div>
    </>
  );
}
