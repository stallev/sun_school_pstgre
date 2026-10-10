"use client";

import { ContentText, Heading } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { PulseCard } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { WeeklyIntervalInput } from "@pulse/domain";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider.client";

import { getScheduleWeekdays } from "@/lib/trainer/schedule-weekdays";

import { IntervalChip } from "./IntervalChip";

export type ScheduleDayRowProps = {
  dayOfWeek: number;
  intervals: WeeklyIntervalInput[];
  enabled: boolean;
  disabled?: boolean;
  onToggleDay: (enabled: boolean) => void;
  onRequestAddInterval: (dayOfWeek: number) => void;
  onRemoveInterval: (index: number) => void;
};

export function ScheduleDayRow({  dayOfWeek,
  intervals,
  enabled,
  disabled = false,
  onToggleDay,
  onRequestAddInterval,
  onRemoveInterval,
}: ScheduleDayRowProps) {
  const messages = useMessages();
  const locale = useLocale();

  const day = getScheduleWeekdays(locale).find(
    (item) => item.dayOfWeek === dayOfWeek,
  );
  if (!day) {
    return null;
  }

  return (
    <PulseCard className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container font-heading text-base text-on-primary-container">
            {day.short}
          </span>
          <div className="min-w-0">
            <Heading as="h3" visualLevel="h5">
              {day.label}
            </Heading>
            <ContentText variant="muted" as="p" className="text-xs">
              {enabled
                ? messages.trainer.schedule.intervalCount.replace(
                    "{count}",
                    String(intervals.length),
                  )
                : messages.trainer.schedule.dayOff}
            </ContentText>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggleDay}
          disabled={disabled}
          aria-busy={disabled}
          aria-label={
            enabled
              ? messages.trainer.schedule.dayToggleOn.replace("{day}", day.label)
              : messages.trainer.schedule.dayToggleOff.replace("{day}", day.label)
          }
          className="h-7 w-12"
        />
      </div>
      {enabled ? (
        <div className="flex flex-wrap items-center gap-2">
          {intervals.map((interval, index) => (
            <IntervalChip
              key={`${interval.startTime}-${interval.endTime}-${index}`}
              startTime={interval.startTime}
              endTime={interval.endTime}
              onRemove={() => onRemoveInterval(index)}
              disabled={disabled}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-dashed"
            onClick={() => onRequestAddInterval(dayOfWeek)}
            disabled={disabled}
            aria-busy={disabled}
          >
            {messages.trainer.schedule.addSlot}
          </Button>
        </div>
      ) : null}
    </PulseCard>
  );
}
