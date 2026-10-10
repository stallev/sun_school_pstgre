import { ContentText } from "@/components/atoms";
import { cn } from "@/lib/utils";

export type MetaRowProps = {
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function MetaRow({ icon, children, className }: MetaRowProps) {
  return (
    <div className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      {icon ? <span aria-hidden className="inline-flex shrink-0">{icon}</span> : null}
      <ContentText variant="mutedMicro" as="span">
        {children}
      </ContentText>
    </div>
  );
}
