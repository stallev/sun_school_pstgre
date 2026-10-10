"use client";

import { Input, type InputProps } from "@/components/ui/input";
import { normalizeScheduleTimeInput } from "@/lib/trainer/format-schedule-time";
import { cn } from "@/lib/utils";

export type ScheduleTimeInputProps = Omit<
  InputProps,
  "type" | "value" | "onChange" | "inputMode"
> & {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
};

export function ScheduleTimeInput({
  value,
  onChange,
  invalid = false,
  className,
  onBlur,
  ...props
}: ScheduleTimeInputProps) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) {
      onChange(digits);
      return;
    }

    onChange(`${digits.slice(0, 2)}:${digits.slice(2)}`);
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      spellCheck={false}
      maxLength={5}
      placeholder="09:00"
      value={value}
      onChange={handleChange}
      aria-invalid={invalid || undefined}
      className={cn("font-mono tabular-nums", className)}
      onBlur={(event) => {
        onChange(normalizeScheduleTimeInput(value));
        onBlur?.(event);
      }}
    />
  );
}
