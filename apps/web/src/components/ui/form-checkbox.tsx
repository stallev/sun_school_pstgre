"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type FormCheckboxProps = {
  id?: string;
  name: string;
  /** Submitted when checked; defaults to `on` for boolean flags. */
  value?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export const FormCheckbox = ({
  id,
  name,
  value = "on",
  defaultChecked = false,
  checked: checkedProp,
  onCheckedChange,
  disabled,
  className,
}: FormCheckboxProps) => {
  const [uncontrolled, setUncontrolled] = useState(defaultChecked);
  const checked = checkedProp ?? uncontrolled;

  const handleCheckedChange = (next: boolean) => {
    if (checkedProp === undefined) setUncontrolled(next);
    onCheckedChange?.(next);
  };

  return (
    <>
      {checked ? <input type="hidden" name={name} value={value} /> : null}
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        className={cn(className)}
        onCheckedChange={(next) => handleCheckedChange(next === true)}
      />
    </>
  );
};
