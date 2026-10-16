import { Skeleton } from "@/components/ui/skeleton";

const ProfileLoading = () => (
  <main className="space-y-6">
    <Skeleton className="h-8 w-40" />
    <Skeleton className="h-4 w-full max-w-md" />
    <div className="space-y-4 rounded-xl border border-line bg-surface p-4">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="space-y-4 rounded-xl border border-line bg-surface p-4">
      <Skeleton className="h-5 w-56" />
      <Skeleton className="h-16 w-full" />
    </div>
  </main>
);

export default ProfileLoading;
