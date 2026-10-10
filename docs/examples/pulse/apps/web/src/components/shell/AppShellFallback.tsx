import { AppShellCanvas } from "@/components/shell/AppShellCanvas";
import { TopBarFallback } from "@/components/shell/TopBarFallback";
import { Skeleton } from "@/components/ui/skeleton";

export function AppShellFallback() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <TopBarFallback />
      <div className="flex min-h-0 flex-1 flex-col items-center">
        <AppShellCanvas>
          <aside className="hidden w-52 shrink-0 border-r border-border/60 px-3 py-6 md:flex lg:w-60">
            <div className="flex w-full flex-col">
              <Skeleton className="mb-4 h-4 w-24" />
              <div className="flex flex-col gap-1">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-11 w-full rounded-full" />
                ))}
              </div>
            </div>
          </aside>
          <main
            id="main-content"
            className="min-w-0 flex-1 px-4 pt-4 md:px-6 md:pt-6 lg:px-8"
          >
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-6 h-40 w-full rounded-xl" />
          </main>
        </AppShellCanvas>
      </div>
      <nav
        aria-hidden
        className="sticky bottom-0 border-t border-border/70 bg-background/95 px-2 py-2 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex flex-col items-center gap-1 py-1">
              <Skeleton className="h-7 w-12 rounded-full" />
              <Skeleton className="h-2.5 w-10 rounded-full" />
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
