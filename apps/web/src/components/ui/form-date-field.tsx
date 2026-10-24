"use client";

import { useState } from "react";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import { DateField } from "@/components/ui/date-field";

type FormDateFieldProps = {
  id?: string;
  name: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (iso: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  invalid?: boolean;
  locale: MessageLocale;
  calendarAriaLabel: string;
  className?: string;
};

export const FormDateField = ({
  id,
  name,
  defaultValue = "",
  value: valueProp,
  onValueChange,
  min,
  max,
  disabled,
  invalid,
  locale,
  calendarAriaLabel,
  className,
}: FormDateFieldProps) => {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = valueProp ?? uncontrolled;

  const handleChange = (iso: string) => {
    if (valueProp === undefined) setUncontrolled(iso);
    onValueChange?.(iso);
  };

  return (
    <DateField
      id={id}
      name={name}
      value={value}
      onChange={handleChange}
      min={min}
      max={max}
      disabled={disabled}
      invalid={invalid}
      locale={locale}
      calendarAriaLabel={calendarAriaLabel}
      className={className}
    />
  );
};
