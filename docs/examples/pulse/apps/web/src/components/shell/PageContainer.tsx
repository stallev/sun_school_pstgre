import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "page" | "narrow";
  withBottomNav?: boolean;
  /** When true, main lives inside AppShellCanvas (no duplicate max-w-[1400px]) */
  inShellCanvas?: boolean;
};

export function PageContainer({
  children,
  className,
  variant = "page",
  withBottomNav = true,
  inShellCanvas = false,
}: PageContainerProps) {
  return (
    <Container
      as="main"
      id="main-content"
      variant={inShellCanvas ? "shellMain" : "page"}
      className={cn(
        !inShellCanvas && "min-w-0 flex-1",
        withBottomNav ? "pb-24 md:pb-6" : "pb-6",
        variant === "narrow" && !inShellCanvas && "max-w-2xl",
        className,
      )}
    >
      {children}
    </Container>
  );
}
