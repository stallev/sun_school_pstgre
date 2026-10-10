"use client";

import { Trash2Icon } from "lucide-react";

import { ContentText, Heading } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { PulseCard } from "@/components/ui/card";
import { useMessages } from "@/components/i18n/LocaleProvider.client";
import type { TrainerScheduleExceptionForEdit } from "@/data/trainer/get-trainer-schedule-for-edit.server";

export type ExceptionCardProps = {
  exception: TrainerScheduleExceptionForEdit;
  disabled?: boolean;
  onDelete: (exceptionId: string) => void;
};

export function ExceptionCard({
  exception,
  disabled = false,
  onDelete,
}: ExceptionCardProps) {
  const messages = useMessages();

  return (
    <PulseCard className="flex items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <Heading as="h3" visualLevel="h5">
          {exception.exceptionDate}
        </Heading>
        <ContentText variant="muted" as="p" className="text-xs">
          {exception.isBlocked
            ? messages.trainer.schedule.blocked
            : exception.reason ?? "—"}
        </ContentText>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onDelete(exception.id)}
        disabled={disabled}
        aria-busy={disabled}
        aria-label={messages.trainer.schedule.deleteException}
      >
        <Trash2Icon className="size-4" aria-hidden />
      </Button>
    </PulseCard>
  );
}
