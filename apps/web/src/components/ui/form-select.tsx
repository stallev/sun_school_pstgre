"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FormSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type FormSelectProps = {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: FormSelectOption[];
  placeholder?: string;
  /** Shown on the disabled trigger when `options` is empty; falls back to `placeholder`. */
  emptyHint?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  "aria-label"?: string;
  triggerClassName?: string;
};

export const FormSelect = ({
  id,
  name,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  options,
  placeholder,
  emptyHint,
  disabled,
  required,
  invalid,
  "aria-label": ariaLabel,
  triggerClassName,
}: FormSelectProps) => {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = valueProp ?? uncontrolled;

  const handleChange = (next: string | null) => {
    const resolved = next ?? "";
    if (valueProp === undefined) setUncontrolled(resolved);
    onValueChange?.(resolved);
  };

  const isOptionsEmpty = options.length === 0;
  const isSelectDisabled = Boolean(disabled) || isOptionsEmpty;
  const hintWhenEmpty = emptyHint ?? placeholder;
  const triggerPlaceholder = isOptionsEmpty ? hintWhenEmpty : placeholder;
  const showPlaceholderItem = placeholder !== undefined && !isOptionsEmpty;

  return (
    <>
      {name ? (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required && value === ""}
          disabled={isSelectDisabled}
        />
      ) : null}
      <Select value={value} onValueChange={handleChange} disabled={isSelectDisabled}>
        <SelectTrigger
          id={id}
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          className={cn("w-full", triggerClassName)}
        >
          <SelectValue placeholder={triggerPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {showPlaceholderItem ? (
            <SelectItem value="" disabled={required}>
              {placeholder}
            </SelectItem>
          ) : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
};
