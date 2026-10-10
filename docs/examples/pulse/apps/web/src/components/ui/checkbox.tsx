"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export const checkboxVariants = cva(
  [
    "peer relative flex shrink-0 items-center justify-center rounded-[4px] border border-input bg-card transition-colors outline-none",
    "after:absolute after:-inset-x-3 after:-inset-y-2",
    "focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "group-has-disabled/field:opacity-50",
    "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/30",
    "data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground",
  ],
  {
    variants: {
      size: {
        default: "size-5 [&>svg]:size-3.5",
        sm: "size-4 [&>svg]:size-3",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export interface CheckboxProps
  extends React.ComponentProps<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {}

function Checkbox({ className, size, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(checkboxVariants({ size }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon aria-hidden />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
