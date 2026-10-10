import { ContentText, SectionTitle } from "@/components/atoms";
import type { TrainerSchedulePreview } from "@/data/trainer/get-trainer-schedule-preview.server";
import { groupScheduleSlotsByDay } from "@/lib/trainer/group-schedule-slots";
import { getLocale, getMessages } from "@/lib/messages/server";

import { cn } from "@/lib/utils";

export type TrainerSchedulePreviewProps = {
  preview: TrainerSchedulePreview;
};

export async function TrainerSchedulePreviewPanel({ preview }: TrainerSchedulePreviewProps) {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);
  const dayGroups = groupScheduleSlotsByDay(
    preview.timezone,
    preview.slots,
    locale,
  );

  if (dayGroups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center">
        <SectionTitle as="h3">{messages.trainer.profile.scheduleEmpty.title}</SectionTitle>
        <ContentText variant="muted" as="p" className="mt-2">
          {messages.trainer.profile.scheduleEmpty.description}
        </ContentText>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle as="h3">{messages.trainer.profile.scheduleThisWeek}</SectionTitle>
        <ContentText variant="mutedMicro" as="p" className="font-mono">
          {preview.timezoneLabel}
        </ContentText>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar md:mx-0 md:px-0">
        {dayGroups.map((day) => (
          <div
            key={day.localDate}
            className="min-w-[3.5rem] rounded-2xl bg-primary px-3 py-2 text-center text-primary-foreground"
          >
            <ContentText variant="mutedMicro" as="p" className="text-primary-foreground/90">
              {day.dayLabel}
            </ContentText>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {preview.slots.slice(0, 12).map((slot) => (
          <div
            key={slot.startsAtUtc}
            className={cn(
              "rounded-xl border border-border bg-card px-2 py-2 text-center",
              "text-sm font-medium text-foreground",
            )}
          >
            {slot.localLabel}
          </div>
        ))}
      </div>
    </div>
  );
}
