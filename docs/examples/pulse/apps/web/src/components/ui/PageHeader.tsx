import { Heading } from "@/components/atoms";
import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  title: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, action, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-3",
        className,
      )}
    >
      <Heading as="h1" visualLevel="h1">
        {title}
      </Heading>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
