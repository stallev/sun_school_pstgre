"use client";

import { ContentText, Heading } from "@/components/atoms";
import { PulseCard } from "@/components/ui/card";
import { ScheduleDayPickerRow } from "@/components/ui/ScheduleDayPickerRow.client";
import { SchedulePickerEmptyDay } from "@/components/ui/SchedulePickerEmptyDay";
import { TimeSlotButton } from "@/components/ui/TimeSlotButton";
import { cn } from "@/lib/utils";

export type ScheduleDay = {
  id: string;
  weekday: string;
  day: string;
};

export type ScheduleSlot = {
  id: string;
  label: string;
  available?: boolean;
};

export type SchedulePickerProps = {
  days: ReadonlyArray<ScheduleDay>;
  slots: ReadonlyArray<ScheduleSlot>;
  activeDayId: string;
  selectedSlotId?: string;
  onDayChange: (dayId: string) => void;
  onSlotSelect?: (slotId: string) => void;
  timezoneLabel?: string;
  title?: string;
  emptySlotsTitle?: string;
  emptySlotsDescription?: string;
  swipeDaysHint?: string;
  className?: string;
};

export function SchedulePicker({
  days,
  slots,
  activeDayId,
  selectedSlotId,
  onDayChange,
  onSlotSelect,
  timezoneLabel = "America/New_York (UTC−5)",
  title = "This week",
  emptySlotsTitle,
  emptySlotsDescription,
  swipeDaysHint,
  className,
}: SchedulePickerProps) {
  const showEmptyDay =
    slots.length === 0 &&
    Boolean(emptySlotsTitle) &&
    Boolean(emptySlotsDescription);
  const slotsPanelId = `schedule-slots-${activeDayId}`;

  return (
    <PulseCard
      variant="base"
      className={cn("min-w-0 overflow-hidden p-5 md:p-6", className)}
    >
      <header className="mb-5 space-y-1.5 md:mb-6">
        <Heading as="h3" visualLevel="h3">
          {title}
        </Heading>
        <ContentText variant="mutedMicro" as="p" className="font-mono">
          {timezoneLabel}
        </ContentText>
      </header>

      <ScheduleDayPickerRow
        days={days}
        activeDayId={activeDayId}
        onDayChange={onDayChange}
        swipeHint={swipeDaysHint}
      />

      {showEmptyDay ? (
        <SchedulePickerEmptyDay
          title={emptySlotsTitle!}
          description={emptySlotsDescription!}
        />
      ) : (
        <div
          id={slotsPanelId}
          role="tabpanel"
          aria-labelledby={`schedule-day-${activeDayId}`}
          className="mt-5 grid grid-cols-3 gap-2.5 md:mt-6 md:gap-3"
        >
          {slots.map((slot) => (
            <TimeSlotButton
              key={slot.id}
              available={slot.available ?? true}
              selected={selectedSlotId === slot.id}
              onClick={() => onSlotSelect?.(slot.id)}
            >
              {slot.label}
            </TimeSlotButton>
          ))}
        </div>
      )}
    </PulseCard>
  );
}
