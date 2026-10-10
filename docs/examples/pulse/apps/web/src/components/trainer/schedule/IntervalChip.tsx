"use client";

import { XIcon } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider.client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type IntervalChipProps = {
  startTime: string;
  endTime: string;
  onRemove: () => void;
  disabled?: boolean;
};

export function IntervalChip({
  startTime,
  endTime,
  onRemove,
  disabled = false,
}: IntervalChipProps) {
  const messages = useMessages();
  const removeAriaLabel = messages.trainer.schedule.removeIntervalAriaLabel
    .replace("{start}", startTime)
    .replace("{end}", endTime);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-xl bg-muted px-2.5 py-1.5 font-mono text-xs",
        disabled && "opacity-60",
      )}
    >
      {startTime}–{endTime}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={onRemove}
        disabled={disabled}
        aria-label={removeAriaLabel}
      >
        <XIcon className="size-3.5" aria-hidden />
      </Button>
    </span>
  );
}
