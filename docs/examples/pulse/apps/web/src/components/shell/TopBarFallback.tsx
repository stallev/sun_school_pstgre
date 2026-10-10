import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export function TopBarFallback() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <Container variant="shell" className="flex h-16 items-center gap-3">
        <Skeleton className="h-8 w-24 rounded-full" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
      </Container>
    </header>
  );
}
