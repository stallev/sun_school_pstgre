import { Skeleton } from "@/components/ui/skeleton";

export default function TrainerClientsLoading() {
  return (
    <>
      <Skeleton className="h-9 w-36" />
      <div className="mt-6 space-y-4">
        <Skeleton className="h-10 w-full rounded-full md:max-w-md" />
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    </>
  );
}
