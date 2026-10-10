import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { contentTextVariants } from "../content-text-variants";

/**
 * ContentText — every non-heading text role in the app.
 *
 *  Choose a `variant` for typography (size + weight + color).
 *  Use `className` for layout (margins, width, alignment, flex).
 *  Default variant when omitted: `bodyMuted`.
 *
 *  Examples:
 *      <ContentText variant="body">Primary paragraph</ContentText>
 *      <ContentText variant="muted" as="span">Card meta</ContentText>
 *      <ContentText variant="caption">UPCOMING SESSION</ContentText>
 */
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
