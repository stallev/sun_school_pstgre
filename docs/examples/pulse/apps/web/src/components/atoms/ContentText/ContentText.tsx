import * as React from "react";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { contentTextVariants } from "../content-text-variants";

type Tag = "p" | "span" | "div";

export interface ContentTextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color">,
    VariantProps<typeof contentTextVariants> {
  as?: Tag;
}

export function ContentText({
  as: As = "p",
  variant,
  className,
  children,
  ...rest
}: ContentTextProps) {
  return (
    <As
      className={cn(contentTextVariants({ variant }), className)}
      {...(rest as React.HTMLAttributes<HTMLElement>)}
    >
      {children}
    </As>
  );
}
