import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertTextVariants = cva("font-body text-sm", {
  variants: {
    tone: {
      error: "text-danger",
      success: "text-ok",
      warning: "text-warn",
    },
  },
  defaultVariants: { tone: "error" },
});

type AlertTextProps = ComponentProps<"p"> &
  VariantProps<typeof alertTextVariants>;

/** Field error / inline status text; colour is paired with the text itself (not colour-only). */
export const AlertText = ({ tone, className, role, ...props }: AlertTextProps) => (
  <p
    role={role ?? (tone === "error" || tone === undefined ? "alert" : "status")}
    className={cn(alertTextVariants({ tone }), className)}
    {...props}
  />
);
