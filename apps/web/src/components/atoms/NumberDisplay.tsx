import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const numberDisplayVariants = cva("font-display text-ink tabular-nums", {
  variants: {
    size: {
      kpi: "text-2xl",
      score: "text-3xl",
    },
  },
  defaultVariants: { size: "score" },
});

type NumberDisplayProps = ComponentProps<"span"> & VariantProps<typeof numberDisplayVariants>;

/** Large counter / score; `tabular-nums` so columns of numbers align. */
export const NumberDisplay = ({ className, size, ...props }: NumberDisplayProps) => (
  <span className={cn(numberDisplayVariants({ size }), className)} {...props} />
);
