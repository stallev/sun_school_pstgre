import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Heading — semantic headings (h1–h6) with optional `visualLevel`.
 *
 *  - `as`            controls the rendered HTML element (h1…h6).
 *  - `visualLevel`   controls the visual scale; defaults to match `as`.
 *  - `variant`       default | brand (uses --primary).
 *
 *  Mix `as` and `visualLevel` to keep semantic hierarchy correct while
 *  using a bigger or smaller visual treatment — e.g. an h1 rendered at
 *  the "display" scale for hero sections:
 *
 *      <Heading as="h1" visualLevel="display">Welcome</Heading>
 */
const headingVariants = cva("font-heading tracking-tight text-foreground", {
  variants: {
    visualLevel: {
      display: "text-[clamp(2.5rem,5vw,3.5rem)] leading-[1.05] font-normal",
      h1:      "text-[clamp(2rem,4vw,2.5rem)] leading-[1.15] font-normal",
      h2:      "text-[clamp(1.625rem,3vw,2rem)] leading-[1.2] font-normal",
      h3:      "text-[1.5rem] leading-[1.25] font-normal",
      h4:      "text-[1.25rem] leading-[1.3] font-sans font-semibold",
      h5:      "text-[1.125rem] leading-[1.4] font-sans font-semibold",
      h6:      "text-[1rem] leading-[1.5] font-sans font-semibold",
    },
    variant: {
      default: "text-foreground",
      brand:   "text-primary",
    },
  },
  defaultVariants: { variant: "default" },
});

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type VisualLevel = NonNullable<VariantProps<typeof headingVariants>["visualLevel"]>;

export interface HeadingProps
  extends Omit<React.HTMLAttributes<HTMLHeadingElement>, "color">,
    Omit<VariantProps<typeof headingVariants>, "visualLevel"> {
  as: HeadingTag;
  visualLevel?: VisualLevel;
}

export function Heading({
  as: As,
  visualLevel,
  variant,
  className,
  children,
  ...rest
}: HeadingProps) {
  const effective: VisualLevel = visualLevel ?? (As as VisualLevel);
  return (
    <As
      className={cn(headingVariants({ visualLevel: effective, variant }), className)}
      {...rest}
    >
      {children}
    </As>
  );
}
