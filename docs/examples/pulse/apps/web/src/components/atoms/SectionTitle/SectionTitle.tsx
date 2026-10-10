import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { Heading } from "../Heading/Heading";

const sectionTitleVariants = cva("text-center mx-auto max-w-3xl", {
  variants: {
    variant: {
      default: "text-foreground",
      dark: "text-on-brand-band",
    },
  },
  defaultVariants: { variant: "default" },
});

type Tag = "h1" | "h2" | "h3";

export interface SectionTitleProps
  extends Omit<React.HTMLAttributes<HTMLHeadingElement>, "color">,
    VariantProps<typeof sectionTitleVariants> {
  as?: Tag;
}

export function SectionTitle({
  as = "h2",
  variant,
  className,
  children,
  ...rest
}: SectionTitleProps) {
  const visualLevel = as === "h1" ? "display" : as === "h2" ? "h1" : "h2";
  return (
    <Heading
      as={as}
      visualLevel={visualLevel}
      className={cn(sectionTitleVariants({ variant }), className)}
      {...rest}
    >
      {children}
    </Heading>
  );
}
