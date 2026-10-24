"use client";

import dynamic from "next/dynamic";
import { Popover } from "@base-ui/react/popover";
import { CalendarIcon } from "lucide-react";
import { useId, useState } from "react";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import {
  formatDate,
  getDateInputPlaceholder,
  parseLocaleDateInput,
} from "@/lib/i18n/format";
import { isIsoDateWithinRange } from "@/lib/date/iso-date";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DateFieldCalendar = dynamic(
  () =>
    import("./date-field-calendar.client").then((module) => ({
      default: module.DateFieldCalendar,
    })),
  { ssr: false },
);

type DateFieldProps = {
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  locale: MessageLocale;
  calendarAriaLabel: string;
  id?: string;
  className?: string;
};

export const DateField = ({
  value,
  onChange,
  min,
  max,
  name,
  disabled = false,
  invalid = false,
  locale,
  calendarAriaLabel,
  id: idProp,
  className,
}: DateFieldProps) => {
  const autoId = useId();
  const inputId = idProp ?? autoId;
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [parseInvalid, setParseInvalid] = useState(false);

  const formattedValue = value ? formatDate(value, locale) : "";
  const text = isEditing ? draft : formattedValue;

  const showInvalid = invalid || parseInvalid;
  const hiddenValue = value;

  const commitText = (nextText: string) => {
    setDraft(nextText);
    const parsed = parseLocaleDateInput(nextText, locale);
    if (!nextText.trim()) {
      setParseInvalid(false);
      onChange("");
      return;
    }
    if (parsed.isCompleteInvalid) {
      setParseInvalid(true);
      return;
    }
    if (!parsed.iso) {
      setParseInvalid(false);
      return;
    }
    if (!isIsoDateWithinRange(parsed.iso, min, max)) {
      setParseInvalid(true);
      return;
    }
    setParseInvalid(false);
    onChange(parsed.iso);
  };

  return (
    <div className={cn("flex w-full max-w-sm items-center gap-2", className)}>
      {name ? <input type="hidden" name={name} value={hiddenValue} disabled={disabled} /> : null}
      <Input
        id={inputId}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        aria-invalid={showInvalid || undefined}
        placeholder={getDateInputPlaceholder(locale)}
        value={text}
        className="max-w-none flex-1"
        onFocus={() => {
          setIsEditing(true);
          setDraft(formattedValue);
          setParseInvalid(false);
        }}
        onChange={(event) => commitText(event.target.value)}
        onBlur={(event) => {
          commitText(event.target.value);
          setIsEditing(false);
        }}
      />
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          type="button"
          disabled={disabled}
          aria-label={calendarAriaLabel}
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-input bg-surface text-ink transition-[color,background-color,border-color] duration-100 ease-out-soft hover:bg-paper disabled:pointer-events-none disabled:opacity-45",
            showInvalid && "border-destructive",
          )}
        >
          <CalendarIcon className="size-4" aria-hidden />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="bottom" align="end" collisionAvoidance={{ side: "flip" }}>
            <Popover.Popup
              className="z-50 rounded-xl border border-line bg-surface p-1 shadow-float outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95"
            >
              <DateFieldCalendar
                locale={locale}
                selectedIso={value || undefined}
                min={min}
                max={max}
                onSelectIso={(iso) => {
                  setParseInvalid(false);
                  onChange(iso);
                  setOpen(false);
                }}
              />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};
