import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const headingVariants = cva("font-heading tracking-tight text-foreground", {
  variants: {
    visualLevel: {
      display:
        "text-[30px] md:text-[44px] leading-tight font-normal",
      h1: "text-[26px] md:text-[36px] leading-tight font-normal",
      h2: "text-[22px] leading-7 tracking-tight font-normal",
      h3: "text-[18px] leading-tight font-normal",
      h4: "text-[17px] leading-tight font-sans font-medium",
      h5: "text-[15px] leading-snug font-sans font-semibold",
      h6: "text-[13px] leading-normal font-sans font-semibold",
    },
    variant: {
      default: "text-foreground",
      brand: "text-primary",
    },
  },
  defaultVariants: { variant: "default" },
});

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type VisualLevel = NonNullable<
  VariantProps<typeof headingVariants>["visualLevel"]
>;

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
      className={cn(
        headingVariants({ visualLevel: effective, variant }),
        className,
      )}
      {...rest}
    >
      {children}
    </As>
  );
}
