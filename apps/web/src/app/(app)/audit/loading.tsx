import { Skeleton } from "@/components/ui/skeleton";

const AuditLoading = () => (
  <div className="space-y-6">
    <Skeleton className="h-10 w-64" />
    <Skeleton className="h-40 w-full rounded-xl" />
    <Skeleton className="h-96 w-full rounded-xl" />
  </div>
);

export default AuditLoading;
