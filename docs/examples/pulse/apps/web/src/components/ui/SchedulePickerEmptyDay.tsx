import { CalendarX2Icon } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export type SchedulePickerEmptyDayProps = {
  title: string;
  description: string;
};

export function SchedulePickerEmptyDay({
  title,
  description,
}: SchedulePickerEmptyDayProps) {
  return (
    <div
      className="mt-5 rounded-2xl border border-dashed border-border/70 bg-muted/25 px-4 py-6 md:px-5 md:py-7"
      role="status"
      aria-live="polite"
    >
      <Empty className="gap-3 border-0 bg-transparent p-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarX2Icon aria-hidden className="size-4" />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
