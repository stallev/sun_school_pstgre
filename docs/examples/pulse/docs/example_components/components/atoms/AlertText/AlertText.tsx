import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * AlertText — short, blocking, destructive inline alert.
 *
 *  Use for form-level or operation-blocking errors. For alerts that need
 *  an icon, title, or actions, use the full <Alert> shadcn primitive
 *  (components/ui/alert.tsx) instead — this atom is intentionally minimal.
 *
 *  Role is fixed to "alert" so screen readers announce it.
 */
export interface AlertTextProps
  extends Omit<React.HTMLAttributes<HTMLParagraphElement>, "role"> {}

export function AlertText({ className, children, ...rest }: AlertTextProps) {
  return (
    <p
      role="alert"
      className={cn(
        "rounded-lg border border-destructive bg-destructive/10 text-destructive",
        "px-3 py-2 text-sm leading-snug",
        className
      )}
      {...rest}
    >
      {children}
    </p>
  );
}
