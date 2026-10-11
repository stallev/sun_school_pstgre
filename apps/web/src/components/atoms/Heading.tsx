import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const headingVariants = cva("font-display font-medium text-ink", {
  variants: {
    level: {
      page: "text-[1.75rem] leading-[1.1] tracking-[-0.01em] sm:text-[2.125rem]",
      section: "text-xl leading-snug",
    },
  },
  defaultVariants: { level: "page" },
});

type HeadingProps = ComponentProps<"h1"> &
  VariantProps<typeof headingVariants> & { as?: "h1" | "h2" | "h3" };

/** Page title (`h1`, one per screen); `level="section"` for `h2` blocks (UX-03 §6). */
export const Heading = ({
  level = "page",
  as,
  className,
  ...props
}: HeadingProps) => {
  const Tag = as ?? (level === "page" ? "h1" : "h2");
  return <Tag className={cn(headingVariants({ level }), className)} {...props} />;
};
