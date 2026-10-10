"use client";

import { useId } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider.client";

import { getScheduleWeekdays } from "@/lib/trainer/schedule-weekdays";

import { AddIntervalForm } from "./AddIntervalForm.client";

export type AddIntervalOverlayProps = {
  open: boolean;
  dayOfWeek: number | null;
  resetKey?: number;
  onOpenChange: (open: boolean) => void;
  onAdd: (startTime: string, endTime: string) => void;
  disabled?: boolean;
};

function getDayLabel(dayOfWeek: number | null, locale: ReturnType<typeof useLocale>): string | null {
  if (dayOfWeek === null) {
    return null;
  }

  return (
    getScheduleWeekdays(locale).find((day) => day.dayOfWeek === dayOfWeek)?.label ??
    null
  );
}

export function AddIntervalOverlay({  open,
  dayOfWeek,
  resetKey = 0,
  onOpenChange,
  onAdd,
  disabled = false,
}: AddIntervalOverlayProps) {
  const messages = useMessages();
  const locale = useLocale();

  const isMobile = useIsMobile();
  const formId = useId();
  const dayLabel = getDayLabel(dayOfWeek, locale);
  const formInstanceKey = `${dayOfWeek ?? "none"}-${resetKey}`;

  function handleAdd(startTime: string, endTime: string) {
    onAdd(startTime, endTime);
    onOpenChange(false);
  }

  const desktopDescription = dayLabel
    ? messages.trainer.schedule.addIntervalDescriptionForDay.replace(
        "{day}",
        dayLabel,
      )
    : messages.trainer.schedule.addIntervalDescription;

  if (isMobile) {
    const mobileTitle = dayLabel
      ? messages.trainer.schedule.addIntervalTitleWithDay.replace(
          "{day}",
          dayLabel,
        )
      : messages.trainer.schedule.addIntervalTitle;

    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="flex flex-col px-5 pt-0">
          <SheetHeader className="px-0 text-left">
            <SheetTitle>{mobileTitle}</SheetTitle>
          </SheetHeader>
          <AddIntervalForm
            key={formInstanceKey}
            formId={formId}
            mobileSheet
            disabled={disabled}
            onSubmit={handleAdd}
            onCancel={() => onOpenChange(false)}
          />
          <SheetFooter className="flex-row gap-2 px-0 pb-0">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 flex-1"
              onClick={() => onOpenChange(false)}
              disabled={disabled}
            >
              {messages.trainer.schedule.cancel}
            </Button>
            <Button
              type="submit"
              form={formId}
              className="min-h-11 flex-1"
              disabled={disabled}
              aria-busy={disabled}
            >
              {messages.trainer.schedule.addSlot}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4">
        <DialogHeader>
          <DialogTitle>{messages.trainer.schedule.addIntervalTitle}</DialogTitle>
          <DialogDescription>{desktopDescription}</DialogDescription>
        </DialogHeader>
        <AddIntervalForm
          key={formInstanceKey}
          formId={formId}
          disabled={disabled}
          onSubmit={handleAdd}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
