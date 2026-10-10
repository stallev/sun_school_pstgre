"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Heading } from "@/components/atoms";
import { deleteScheduleExceptionAction } from "@/actions/trainer/delete-schedule-exception";
import { saveScheduleExceptionAction } from "@/actions/trainer/save-schedule-exception";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { TrainerScheduleExceptionForEdit } from "@/data/trainer/get-trainer-schedule-for-edit.server";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";
import { formatPrismaDate } from "@/lib/trainer/schedule-time";

import { ExceptionCard } from "./ExceptionCard.client";

export type TrainerScheduleExceptionsTabProps = {
  exceptions: TrainerScheduleExceptionForEdit[];
  onExceptionsChange: (exceptions: TrainerScheduleExceptionForEdit[]) => void;
};

export function TrainerScheduleExceptionsTab({  exceptions,
  onExceptionsChange,
}: TrainerScheduleExceptionsTabProps) {
  const messages = useMessages();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isBlocked, setIsBlocked] = useState(true);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const blockedDates = useMemo(
    () =>
      exceptions
        .filter((item) => item.isBlocked)
        .map((item) => new Date(`${item.exceptionDate}T00:00:00.000Z`)),
    [exceptions],
  );

  function handleAddException() {
    if (!selectedDate) {
      return;
    }

    const exceptionDate = formatPrismaDate(selectedDate);
    startTransition(async () => {
      const result = await saveScheduleExceptionAction({
        exceptionDate,
        isBlocked,
        reason: reason.trim() || undefined,
      });

      if (!result.ok) {
        toast.error(result.message, { duration: PRODUCT_TOAST_DURATION_MS });
        return;
      }

      onExceptionsChange([
        ...exceptions.filter((item) => item.exceptionDate !== exceptionDate),
        {
          id: result.data.exceptionId,
          exceptionDate,
          isBlocked,
          reason: reason.trim() || null,
        },
      ]);
      setReason("");
    });
  }

  function handleDelete(exceptionId: string) {
    startTransition(async () => {
      const result = await deleteScheduleExceptionAction({ exceptionId });
      if (!result.ok) {
        toast.error(result.message, { duration: PRODUCT_TOAST_DURATION_MS });
        return;
      }

      onExceptionsChange(exceptions.filter((item) => item.id !== exceptionId));
    });
  }

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        modifiers={{ blocked: blockedDates }}
        modifiersClassNames={{ blocked: "bg-destructive/20 line-through" }}
        className="rounded-2xl border border-border bg-card p-3"
      />
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="exception-blocked">
            {messages.trainer.schedule.exceptionBlockedLabel}
          </Label>
          <Switch
            id="exception-blocked"
            checked={isBlocked}
            onCheckedChange={setIsBlocked}
            disabled={isPending}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="exception-reason">
            {messages.trainer.schedule.exceptionReasonLabel}
          </Label>
          <Input
            id="exception-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={isPending}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={handleAddException}
          disabled={isPending || !selectedDate}
          aria-busy={isPending}
        >
          {messages.trainer.schedule.addException}
        </Button>
      </div>
      <div className="space-y-2">
        <Heading as="h2" visualLevel="h5">
          {messages.trainer.schedule.tabs.exceptions}
        </Heading>
        {exceptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {messages.trainer.schedule.addException}
          </p>
        ) : (
          exceptions.map((exception) => (
            <ExceptionCard
              key={exception.id}
              exception={exception}
              disabled={isPending}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
