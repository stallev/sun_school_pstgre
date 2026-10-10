import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const inputVariants = cva(
  [
    "w-full min-w-0 rounded-lg border border-input bg-card text-[15px] text-foreground transition-colors outline-none",
    "placeholder:text-subtle-foreground",
    "hover:border-[hsl(var(--color-ink-2))]",
    "focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive/30",
    "file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
  ],
  {
    variants: {
      size: {
        default: "h-12 px-3.5",
        compact: "h-10 px-3 text-[14px]",
        search: "h-11 rounded-full pl-10 pr-4 text-[14px] md:h-12",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {}

function Input({ className, type, size, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  );
}

export { Input };
