"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import type { Locale } from "date-fns";
import { ChevronDownIcon } from "lucide-react";

import { useLocale } from "@/components/i18n/LocaleProvider.client";
import { buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  formatDateToIsoDateOnly,
  getDatePickerProps,
} from "@/lib/date/iso-date-picker";
import { getDateFnsLocale } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

export type DatePickerFieldProps = {
  id: string;
  name: string;
  label: ReactNode;
  /** ISO `yyyy-MM-dd` from server / initial state */
  defaultValue?: string;
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  error?: string;
  className?: string;
  /** Override date-fns locale; defaults to active app locale */
  dateLocale?: Locale;
  /** Disables dates after today (e.g. birth date) */
  disableFuture?: boolean;
  /** Disables dates before today (e.g. booking) */
  disablePast?: boolean;
  /** Custom disabled-date predicate; runs after disableFuture/disablePast */
  isDateDisabled?: (date: Date) => boolean;
  startMonth?: Date;
  endMonth?: Date;
};

export const DatePickerField = ({
  id,
  name,
  label,
  defaultValue = "",
  placeholder,
  required = false,
  disabled = false,
  invalid = false,
  error,
  className,
  dateLocale: dateLocaleOverride,
  disableFuture = false,
  disablePast = false,
  isDateDisabled,
  startMonth,
  endMonth,
}: DatePickerFieldProps) => {
  const appLocale = useLocale();
  const dateLocale = dateLocaleOverride ?? getDateFnsLocale(appLocale);
  const [open, setOpen] = useState(false);
  const [iso, setIso] = useState(defaultValue);

  useEffect(() => {
    setIso(defaultValue);
  }, [defaultValue]);

  const { selectedDate, defaultMonth } = getDatePickerProps(iso || undefined);
  const today = startOfDay(new Date());
  const currentYear = today.getFullYear();

  const resolvedStartMonth = startMonth ?? new Date(1900, 0);
  const resolvedEndMonth = endMonth ?? new Date(currentYear, 11);

  const disabledDate = useMemo(() => {
    return (date: Date) => {
      const day = startOfDay(date);
      if (disableFuture && isAfter(day, today)) return true;
      if (disablePast && isBefore(day, today)) return true;
      return isDateDisabled?.(day) ?? false;
    };
  }, [disableFuture, disablePast, isDateDisabled, today]);

  const displayLabel =
    iso && selectedDate
      ? format(selectedDate, "PPP", { locale: dateLocale })
      : null;

  return (
    <Field className={className} data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input type="hidden" name={name} value={iso} required={required} disabled={disabled} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          type="button"
          id={id}
          disabled={disabled}
          aria-required={required}
          aria-invalid={invalid}
          aria-expanded={open}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-10 w-full justify-between px-2.5 font-normal md:text-sm",
            invalid && "border-destructive",
          )}
        >
          {displayLabel ? (
            <span className="truncate text-left">{displayLabel}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDownIcon className="size-4 shrink-0 opacity-50" aria-hidden />
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={defaultMonth}
            captionLayout="dropdown"
            captionDropdown="grid"
            locale={dateLocale}
            weekStartsOn={1}
            startMonth={resolvedStartMonth}
            endMonth={resolvedEndMonth}
            disabled={disabledDate}
            onSelect={(date) => {
              if (date) {
                setIso(formatDateToIsoDateOnly(date));
                setOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
};
