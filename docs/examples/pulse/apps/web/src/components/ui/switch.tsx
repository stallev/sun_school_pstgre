"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

export const switchVariants = cva(
  [
    "peer group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors outline-none",
    "after:absolute after:-inset-x-3 after:-inset-y-2",
    "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/30",
    "data-checked:bg-primary data-unchecked:bg-[hsl(var(--color-surface-container))]",
  ],
  {
    variants: {
      size: {
        default: "h-7 w-12 min-h-10 min-w-10",
        sm: "h-6 w-10 min-h-10 min-w-10",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export const switchThumbVariants = cva(
  "pointer-events-none block rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] ring-0 transition-transform data-unchecked:translate-x-0.5",
  {
    variants: {
      size: {
        default: "size-6 group-data-[size=default]/switch:data-checked:translate-x-[22px]",
        sm: "size-5 group-data-[size=sm]/switch:data-checked:translate-x-[18px]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export interface SwitchProps
  extends React.ComponentProps<typeof SwitchPrimitive.Root>,
    VariantProps<typeof switchVariants> {}

function Switch({ className, size = "default", ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(switchVariants({ size }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(switchThumbVariants({ size }))}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
