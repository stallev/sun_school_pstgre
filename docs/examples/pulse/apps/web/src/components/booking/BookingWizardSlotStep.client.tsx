"use client";

import { ContentText, Heading } from "@/components/atoms";
import { SchedulePicker } from "@/components/ui/SchedulePicker.client";
import { Skeleton } from "@/components/ui/skeleton";

import type { SchedulePickerDay, SchedulePickerSlot } from "@/lib/booking/map-slots-to-schedule-picker";
import { useMessages } from "@/components/i18n/LocaleProvider.client";


export type BookingWizardSlotStepProps = {
  days: SchedulePickerDay[];
  slots: SchedulePickerSlot[];
  activeDayId: string;
  selectedSlotId: string | null;
  timezoneLabel: string;
  isLoading: boolean;
  onDayChange: (dayId: string) => void;
  onSlotSelect: (slotId: string) => void;
};

export function BookingWizardSlotStep({  days,
  slots,
  activeDayId,
  selectedSlotId,
  timezoneLabel,
  isLoading,
  onDayChange,
  onSlotSelect,
}: BookingWizardSlotStepProps) {
  const messages = useMessages();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="space-y-2 py-6 text-center">
        <Heading as="h2" visualLevel="h3">
          {messages.booking.wizard.noSlotsTitle}
        </Heading>
        <ContentText variant="muted" as="p">
          {messages.booking.wizard.noSlotsDescription}
        </ContentText>
      </div>
    );
  }

  return (
    <SchedulePicker
      days={days}
      slots={slots}
      activeDayId={activeDayId}
      selectedSlotId={selectedSlotId ?? undefined}
      timezoneLabel={timezoneLabel}
      title={messages.booking.wizard.scheduleTitle}
      emptySlotsTitle={messages.booking.wizard.noSlotsTitle}
      emptySlotsDescription={messages.booking.wizard.noSlotsDescription}
      swipeDaysHint={messages.booking.wizard.swipeDaysHint}
      onDayChange={onDayChange}
      onSlotSelect={onSlotSelect}
    />
  );
}
