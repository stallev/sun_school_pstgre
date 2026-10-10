import { Skeleton } from "@/components/ui/skeleton";

export default function ClientProfileLoading() {
  return (
    <div className="space-y-6 py-4 md:max-w-2xl">
      <Skeleton className="h-9 w-32" />
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-52" />
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <Skeleton className="h-11 w-full" />
      </div>
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}
