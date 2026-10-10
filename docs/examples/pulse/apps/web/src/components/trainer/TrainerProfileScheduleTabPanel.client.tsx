"use client";

import { useEffect, useState } from "react";

import { ContentText, SectionTitle } from "@/components/atoms";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider.client";
import type { TrainerSchedulePreview } from "@/data/trainer/get-trainer-schedule-preview.server";
import { groupScheduleSlotsByDay } from "@/lib/trainer/group-schedule-slots";
import { TrainerSchedulePreviewSkeleton } from "@/components/trainer/TrainerSchedulePreviewSkeleton";

import { cn } from "@/lib/utils";

export type TrainerProfileScheduleTabPanelProps = {
  trainerProfileId: string;
  slotDurationMinutes: number;
};

export function TrainerProfileScheduleTabPanel({
  trainerProfileId,
  slotDurationMinutes,
}: TrainerProfileScheduleTabPanelProps) {
  const messages = useMessages();
  const locale = useLocale();
  const [preview, setPreview] = useState<TrainerSchedulePreview | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(
          `/api/public/trainers/${trainerProfileId}/schedule-preview?slotDurationMinutes=${slotDurationMinutes}`,
        );
        if (!response.ok) {
          throw new Error("schedule preview failed");
        }
        const data = (await response.json()) as {
          preview: TrainerSchedulePreview | null;
        };
        if (!cancelled) {
          setPreview(data.preview);
        }
      } catch {
        if (!cancelled) {
          setPreview(null);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [trainerProfileId, slotDurationMinutes]);

  if (preview === undefined) {
    return <TrainerSchedulePreviewSkeleton />;
  }

  if (!preview) {
    return null;
  }

  const dayGroups = groupScheduleSlotsByDay(
    preview.timezone,
    preview.slots,
    locale,
  );

  if (dayGroups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center">
        <SectionTitle as="h2">{messages.trainer.profile.scheduleEmpty.title}</SectionTitle>
        <ContentText variant="muted" as="p" className="mt-2">
          {messages.trainer.profile.scheduleEmpty.description}
        </ContentText>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle as="h2">{messages.trainer.profile.scheduleThisWeek}</SectionTitle>
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
