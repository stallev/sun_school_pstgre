import { AdminDashboardHeader } from "@/components/admin/AdminDashboardHeader";
import { Heading } from "@/components/atoms";
import { Skeleton } from "@/components/ui/skeleton";
import { getMessages } from "@/lib/messages/server";


export default async function AdminDashboardLoading() {
  const messages = await getMessages();
  return (
    <div className="space-y-8">
      <AdminDashboardHeader />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
      <section className="space-y-3">
        <Heading as="h2" visualLevel="h4">
          {messages.dashboard.adminNeedsAttention.title}
        </Heading>
        <Skeleton className="h-40 rounded-2xl" />
      </section>
    </div>
  );
}
