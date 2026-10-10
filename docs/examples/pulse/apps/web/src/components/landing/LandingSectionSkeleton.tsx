import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export function LandingSectionSkeleton() {
  return (
    <div className="bg-card py-24" aria-busy="true" role="status">
      <Container variant="marketing" className="space-y-8">
        <Skeleton className="mx-auto h-4 w-32" />
        <Skeleton className="mx-auto h-12 w-full max-w-lg" />
        <Skeleton className="mx-auto h-20 w-full max-w-xl" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </Container>
    </div>
  );
}
