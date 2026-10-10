import * as React from "react";

import { ContentText } from "@/components/atoms";
import { PulseCard, type PulseCardProps } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const KPI_TONE_CLASSES = {
  primary: "bg-primary-container text-on-primary-container",
  secondary: "bg-secondary text-secondary-foreground",
  success:
    "bg-[hsl(var(--color-success-container))] text-[color:var(--green-text)]",
  info: "bg-[hsl(var(--color-info-container))] text-[hsl(var(--color-info))]",
} as const;

export type PulseCardKpiTone = keyof typeof KPI_TONE_CLASSES;

export type PulseCardKpiProps = Omit<PulseCardProps, "variant"> & {
  icon: React.ReactNode;
  tone?: PulseCardKpiTone;
  value: React.ReactNode;
  label: React.ReactNode;
  sub?: React.ReactNode;
};

export function PulseCardKpi({
  icon,
  tone = "primary",
  value,
  label,
  sub,
  className,
  ...props
}: PulseCardKpiProps) {
  return (
    <PulseCard variant="kpi" className={cn("h-full", className)} {...props}>
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            KPI_TONE_CLASSES[tone],
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <ContentText variant="statValue" as="p" className="truncate">
            {value}
          </ContentText>
          <ContentText
            variant="muted"
            as="p"
            className="mt-1 line-clamp-2 leading-tight"
          >
            {label}
          </ContentText>
        </div>
      </div>
      {sub ? (
        <ContentText variant="hint" as="p" className="mt-2">
          {sub}
        </ContentText>
      ) : null}
    </PulseCard>
  );
}
