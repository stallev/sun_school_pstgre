import type { LucideIcon } from "lucide-react";

import { ContentText } from "@/components/atoms";
import { cn } from "@/lib/utils";

export type BenefitRowProps = {
  icon: LucideIcon;
  title: React.ReactNode;
  description: React.ReactNode;
  tone?: "default" | "onDark";
  className?: string;
};

export function BenefitRow({
  icon: Icon,
  title,
  description,
  tone = "default",
  className,
}: BenefitRowProps) {
  const onDark = tone === "onDark";

  return (
    <div className={cn("flex items-start gap-4", className)}>
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl",
          onDark
            ? "bg-[hsl(var(--color-on-brand-band)/0.08)] text-[hsl(var(--color-secondary-light))]"
            : "bg-primary-container text-primary",
        )}
      >
        <Icon aria-hidden className="size-5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <ContentText
          variant="smallEmphasis"
          as="p"
          className={cn("mb-1", onDark && "text-on-brand-band")}
        >
          {title}
        </ContentText>
        <ContentText
          variant="small"
          as="p"
          className={cn("leading-snug", onDark && "text-brand-band-muted")}
        >
          {description}
        </ContentText>
      </div>
    </div>
  );
}
