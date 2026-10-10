import { PageHeader } from "@/components/ui/PageHeader";
import { CatalogTrainerGridSkeleton } from "@/components/catalog/CatalogTrainerGridSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { getMessages } from "@/lib/messages/server";


export default async function TrainersLoading() {
  const messages = await getMessages();
  return (
    <div className="space-y-4">
      <PageHeader title={messages.catalog.title} />
      <Skeleton className="h-11 w-full rounded-full" />
      <CatalogTrainerGridSkeleton />
    </div>
  );
}
