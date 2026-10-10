import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Heading } from "../Heading/Heading";

/**
 * SectionTitle — large, centered block titles (marketing-style).
 *
 *  Composes <Heading>. Use for hero sections and big landing blocks.
 *  For in-content / app / admin titles, use <Heading> directly so the
 *  document keeps a single primary <h1>.
 *
 *  variant="dark" — for light text on dark surfaces (e.g. forest panel).
 */
const sectionTitleVariants = cva("text-center mx-auto max-w-3xl", {
  variants: {
    variant: {
      default: "text-foreground",
      dark:    "text-[color:var(--cream)] dark:text-foreground",
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
  // Promote to a bigger visual scale than the semantic tag implies.
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
