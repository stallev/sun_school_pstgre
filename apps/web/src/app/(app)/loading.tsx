import { Skeleton } from "@/components/ui/skeleton";

const AppLoading = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-4 w-full max-w-lg" />
    <Skeleton className="h-4 w-full max-w-md" />
    <Skeleton className="h-32 w-full rounded-xl" />
  </div>
);

export default AppLoading;
