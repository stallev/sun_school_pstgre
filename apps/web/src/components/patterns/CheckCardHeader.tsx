import type { ReactNode } from "react";
import { ContentText } from "@/components/atoms/ContentText";
import { StatusText } from "@/components/ui/status-text";

type CheckCardHeaderProps = {
  studentName: string;
  statusLabel: string;
  statusTone: "neutral" | "ok" | "warn";
  meta?: string;
  actions?: ReactNode;
};

export const CheckCardHeader = ({
  studentName,
  statusLabel,
  statusTone,
  meta,
  actions,
}: CheckCardHeaderProps) => (
  <div className="flex items-start justify-between gap-3">
    <div className="min-w-0 space-y-0.5">
      <p className="truncate font-display text-lg font-medium text-ink">{studentName}</p>
      {meta ? <ContentText tone="muted">{meta}</ContentText> : null}
      <StatusText tone={statusTone}>{statusLabel}</StatusText>
    </div>
    {actions ? <div className="shrink-0">{actions}</div> : null}
  </div>
);
