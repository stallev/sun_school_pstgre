import { cn } from "@/lib/utils";

type AppShellCanvasProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Unified app canvas (prototype parity): sidebar + main share one max-w-[1400px]
 * centered row on md+, aligned with TopBar shell container.
 *
 * Prototype: flex-1 md:flex md:max-w-[1400px] md:w-full md:mx-auto md:px-4 lg:px-6
 */
export function AppShellCanvas({ children, className }: AppShellCanvasProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 w-full max-w-[1400px] flex-1 flex-col px-4 md:flex-row md:items-stretch md:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
