import type { ComponentProps, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusTextVariants = cva(
  "inline-flex items-center gap-1.5 text-sm font-medium",
  {
    variants: {
      tone: {
        neutral: "text-ink-2",
        ok: "text-ok",
        warn: "text-warn",
        danger: "text-danger",
        info: "text-cobalt-ink",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

type StatusTextProps = ComponentProps<"span"> &
  VariantProps<typeof statusTextVariants> & { icon?: ReactNode };

/** Status label; meaning is carried by text (and an optional icon), never by colour alone. */
export const StatusText = ({
  tone,
  icon,
  className,
  children,
  ...props
}: StatusTextProps) => (
  <span className={cn(statusTextVariants({ tone }), className)} {...props}>
    {icon ? <span aria-hidden="true">{icon}</span> : null}
    {children}
  </span>
);
