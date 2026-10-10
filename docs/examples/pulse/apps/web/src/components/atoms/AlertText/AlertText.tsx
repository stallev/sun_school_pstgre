import * as React from "react";

import { cn } from "@/lib/utils";

export type AlertTextProps = Omit<
  React.HTMLAttributes<HTMLParagraphElement>,
  "role"
>;

export function AlertText({ className, children, ...rest }: AlertTextProps) {
  return (
    <p
      role="alert"
      className={cn(
        "rounded-lg border border-destructive bg-destructive/10 text-destructive",
        "px-3 py-2 text-[12px] leading-snug",
        className,
      )}
      {...rest}
    >
      {children}
    </p>
  );
}
