"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid w-full gap-2", className)}
      {...props}
    />
  );
}

export const radioGroupItemVariants = cva(
  [
    "group/radio-group-item peer relative shrink-0 outline-none",
    "after:absolute after:-inset-x-3 after:-inset-y-2",
    "focus-visible:ring-1 focus-visible:ring-primary/30",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/30",
  ],
  {
    variants: {
      variant: {
        default: [
          "flex aspect-square size-5 rounded-full border border-input bg-card",
          "focus-visible:border-primary",
          "data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground",
        ],
        tile: [
          "flex h-11 w-full items-center justify-center rounded-lg border border-input bg-card px-4",
          "text-[13px] font-medium text-muted-foreground transition-colors",
          "hover:border-[hsl(var(--color-ink-2))]",
          "focus-visible:border-primary",
          "data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground",
        ],
        card: [
          "flex size-auto w-full rounded-lg border border-input bg-card p-0",
          "focus-visible:border-primary",
          "data-checked:border-primary data-checked:bg-primary/5",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface RadioGroupItemProps
  extends React.ComponentProps<typeof RadioGroupPrimitive.Item>,
    VariantProps<typeof radioGroupItemVariants> {}

function RadioGroupItem({
  className,
  variant,
  children,
  ...props
}: RadioGroupItemProps) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(radioGroupItemVariants({ variant }), className)}
      {...props}
    >
      {variant === "default" ? (
        <RadioGroupPrimitive.Indicator
          data-slot="radio-group-indicator"
          className="flex size-5 items-center justify-center"
        >
          <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground" />
        </RadioGroupPrimitive.Indicator>
      ) : null}
      {children}
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
