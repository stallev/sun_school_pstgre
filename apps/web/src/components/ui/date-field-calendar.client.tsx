"use client";

import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { ru, enGB } from "react-day-picker/locale";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseIsoDateOnlyToLocalDate } from "@/lib/date/iso-date";

type DateFieldCalendarProps = {
  locale: MessageLocale;
  selectedIso?: string;
  min?: string;
  max?: string;
  onSelectIso: (iso: string) => void;
};

const dayPickerLocale = (locale: MessageLocale) => (locale === "ru" ? ru : enGB);

export const DateFieldCalendar = ({
  locale,
  selectedIso,
  min,
  max,
  onSelectIso,
}: DateFieldCalendarProps) => {
  const defaultClassNames = getDefaultClassNames();
  const selected = selectedIso ? parseIsoDateOnlyToLocalDate(selectedIso) : undefined;
  const minDate = min ? parseIsoDateOnlyToLocalDate(min) : undefined;
  const maxDate = max ? parseIsoDateOnlyToLocalDate(max) : undefined;

  return (
    <DayPicker
      mode="single"
      weekStartsOn={1}
      locale={dayPickerLocale(locale)}
      selected={selected}
      defaultMonth={selected ?? new Date()}
      disabled={[
        ...(minDate ? [{ before: minDate }] : []),
        ...(maxDate ? [{ after: maxDate }] : []),
      ]}
      onSelect={(date) => {
        if (!date) return;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        onSelectIso(`${year}-${month}-${day}`);
      }}
      className="p-2"
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("flex flex-col gap-2", defaultClassNames.months),
        month: cn("flex flex-col gap-2", defaultClassNames.month),
        month_caption: cn("flex items-center justify-center px-2 text-base font-medium", defaultClassNames.month_caption),
        nav: cn("flex items-center justify-between gap-1", defaultClassNames.nav),
        button_previous: cn(buttonVariants({ variant: "ghost", size: "icon-compact" }), defaultClassNames.button_previous),
        button_next: cn(buttonVariants({ variant: "ghost", size: "icon-compact" }), defaultClassNames.button_next),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn("w-9 text-center text-sm text-muted-foreground", defaultClassNames.weekday),
        week: cn("mt-1 flex w-full", defaultClassNames.week),
        day: cn("relative p-0 text-center", defaultClassNames.day),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-normal aria-selected:bg-cobalt-ink aria-selected:text-surface",
          defaultClassNames.day_button,
        ),
        selected: "bg-cobalt-ink text-surface rounded-lg",
        today: "rounded-full bg-ink text-surface",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-40",
      }}
    />
  );
};
