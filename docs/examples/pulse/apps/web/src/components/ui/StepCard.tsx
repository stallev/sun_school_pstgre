import type { LucideIcon } from "lucide-react";

import { ContentText } from "@/components/atoms";
import { cn } from "@/lib/utils";

export type StepCardProps = {
  step: string;
  icon: LucideIcon;
  title: React.ReactNode;
  description: React.ReactNode;
  className?: string;
};

export function StepCard({
  step,
  icon: Icon,
  title,
  description,
  className,
}: StepCardProps) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-[22px] border border-foreground/5 bg-background p-9",
        className,
      )}
    >
      <p
        aria-hidden
        className="mb-6 font-heading text-[88px] leading-[0.88] tracking-tight text-muted-foreground/30"
      >
        {step}
      </p>
      <div className="mb-4 flex size-12 items-center justify-center rounded-[14px] bg-primary-container text-primary">
        <Icon aria-hidden className="size-[22px]" strokeWidth={1.75} />
      </div>
      <h3 className="mb-2.5 text-[20px] font-bold tracking-tight text-foreground">
        {title}
      </h3>
      <ContentText variant="bodyMuted" as="p" className="text-[15px]">
        {description}
      </ContentText>
    </article>
  );
}
