import { Skeleton } from "@/components/ui/skeleton";

const LessonsLoading = () => (
  <div className="space-y-6" aria-busy="true">
    <Skeleton className="h-10 w-48" />
    <Skeleton className="h-24 w-full rounded-xl" />
    <Skeleton className="h-64 w-full rounded-xl" />
  </div>
);

export default LessonsLoading;
