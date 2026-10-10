import { Skeleton } from "@/components/ui/skeleton";

export default function TrainerIncomeLoading() {
  return (
    <>
      <Skeleton className="h-9 w-28" />
      <Skeleton className="mt-4 h-12 w-full rounded-xl" />
      <div className="mt-6 space-y-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      </div>
    </>
  );
}
