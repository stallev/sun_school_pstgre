"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarClockIcon } from "lucide-react";
import { toast } from "sonner";

import { saveWeeklyScheduleAction } from "@/actions/trainer/save-weekly-schedule";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TrainerScheduleForEdit } from "@/data/trainer/get-trainer-schedule-for-edit.server";
import type { WeeklyIntervalInput } from "@pulse/domain";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider.client";

import {
  getScheduleWeekdays,
  groupIntervalsByDay,
} from "@/lib/trainer/schedule-weekdays";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

import { ScheduleDayRow } from "./ScheduleDayRow";
import { AddIntervalOverlay } from "./AddIntervalOverlay.client";
import { TimezoneLabel } from "./TimezoneLabel.client";
import { TrainerScheduleExceptionsTab } from "./TrainerScheduleExceptionsTab.client";

export type TrainerScheduleEditorProps = {
  initialSchedule: TrainerScheduleForEdit;
};

export function TrainerScheduleEditor({  initialSchedule,
}: TrainerScheduleEditorProps) {
  const messages = useMessages();
  const locale = useLocale();

  const [intervals, setIntervals] = useState<WeeklyIntervalInput[]>(
    initialSchedule.intervals,
  );
  const [exceptions, setExceptions] = useState(initialSchedule.exceptions);
  const [enabledDays, setEnabledDays] = useState<Set<number>>(() => {
    const set = new Set<number>();
    for (const interval of initialSchedule.intervals) {
      set.add(interval.dayOfWeek);
    }
    return set;
  });
  const [isPending, startTransition] = useTransition();
  const [addIntervalDay, setAddIntervalDay] = useState<number | null>(null);
  const [addIntervalSession, setAddIntervalSession] = useState(0);

  const weekdays = useMemo(() => getScheduleWeekdays(locale), [locale]);
  const grouped = useMemo(
    () => groupIntervalsByDay(intervals, locale),
    [intervals, locale],
  );

  function handleSave() {
    startTransition(async () => {
      const result = await saveWeeklyScheduleAction({ intervals });
      if (!result.ok) {
        toast.error(result.message, { duration: PRODUCT_TOAST_DURATION_MS });
        return;
      }

      toast.success(messages.trainer.schedule.saved, {
        duration: PRODUCT_TOAST_DURATION_MS,
      });
    });
  }

  function updateDayIntervals(
    dayOfWeek: number,
    nextIntervals: WeeklyIntervalInput[],
  ) {
    setIntervals((current) => [
      ...current.filter((item) => item.dayOfWeek !== dayOfWeek),
      ...nextIntervals,
    ]);
  }

  return (
    <div className="space-y-6 md:max-w-4xl">
      <div className="space-y-2">
        <TimezoneLabel label={initialSchedule.timezoneLabel} />
      </div>
      <Tabs defaultValue="regular">
        <TabsList className="w-full">
          <TabsTrigger value="regular" className="flex-1">
            {messages.trainer.schedule.tabs.regular}
          </TabsTrigger>
          <TabsTrigger value="exceptions" className="flex-1">
            {messages.trainer.schedule.tabs.exceptions}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="regular" className="mt-4 space-y-3">
          {intervals.length === 0 ? (
            <Empty className="border border-dashed border-border/60">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarClockIcon aria-hidden />
                </EmptyMedia>
                <EmptyTitle>{messages.trainer.schedule.empty.title}</EmptyTitle>
                <EmptyDescription>
                  {messages.trainer.schedule.empty.description}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}
          {weekdays.map((day) => {
            const dayIntervals = grouped.get(day.dayOfWeek) ?? [];
            const enabled = enabledDays.has(day.dayOfWeek);

            return (
              <ScheduleDayRow
                key={day.dayOfWeek}
                dayOfWeek={day.dayOfWeek}
                intervals={dayIntervals}
                enabled={enabled}
                disabled={isPending}
                onToggleDay={(nextEnabled) => {
                  setEnabledDays((current) => {
                    const next = new Set(current);
                    if (nextEnabled) {
                      next.add(day.dayOfWeek);
                    } else {
                      next.delete(day.dayOfWeek);
                    }
                    return next;
                  });
                  if (!nextEnabled) {
                    updateDayIntervals(day.dayOfWeek, []);
                  }
                }}
                onRequestAddInterval={(dayOfWeek) => {
                  setAddIntervalDay(dayOfWeek);
                  setAddIntervalSession((current) => current + 1);
                }}
                onRemoveInterval={(index) => {
                  updateDayIntervals(
                    day.dayOfWeek,
                    dayIntervals.filter((_, itemIndex) => itemIndex !== index),
                  );
                }}
              />
            );
          })}
          <Button
            type="button"
            className="w-full md:w-auto"
            onClick={handleSave}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending
              ? messages.trainer.schedule.saving
              : messages.trainer.schedule.save}
          </Button>
        </TabsContent>
        <TabsContent value="exceptions" className="mt-4">
          <TrainerScheduleExceptionsTab
            exceptions={exceptions}
            onExceptionsChange={setExceptions}
          />
        </TabsContent>
      </Tabs>
      <AddIntervalOverlay
        open={addIntervalDay !== null}
        dayOfWeek={addIntervalDay}
        resetKey={addIntervalSession}
        onOpenChange={(open) => {
          if (!open) {
            setAddIntervalDay(null);
          }
        }}
        disabled={isPending}
        onAdd={(startTime, endTime) => {
          if (addIntervalDay === null) {
            return;
          }

          const dayIntervals = grouped.get(addIntervalDay) ?? [];
          setEnabledDays((current) => new Set(current).add(addIntervalDay));
          updateDayIntervals(addIntervalDay, [
            ...dayIntervals,
            { dayOfWeek: addIntervalDay, startTime, endTime },
          ]);
        }}
      />
    </div>
  );
}
