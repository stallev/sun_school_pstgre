import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const textareaVariants = cva(
  [
    "field-sizing-content w-full min-h-16 resize-none rounded-lg border border-input bg-card px-3.5 py-3 text-[15px] text-foreground transition-colors outline-none",
    "placeholder:text-subtle-foreground",
    "hover:border-[hsl(var(--color-ink-2))]",
    "focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive/30",
  ],
  {
    variants: {
      size: {
        default: "",
        compact: "min-h-14 py-2.5 text-[14px]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export interface TextareaProps
  extends React.ComponentProps<"textarea">,
    VariantProps<typeof textareaVariants> {}

function Textarea({ className, size, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ size }), className)}
      {...props}
    />
  );
}

export { Textarea };
