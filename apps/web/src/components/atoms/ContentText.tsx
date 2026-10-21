import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const contentTextVariants = cva("", {
  variants: {
    tone: {
      body: "font-body text-base text-ink",
      secondary: "font-body text-base text-ink-2",
      muted: "font-body text-sm text-muted",
    },
  },
  defaultVariants: { tone: "body" },
});

type ContentTextProps = ComponentProps<"p"> &
  VariantProps<typeof contentTextVariants>;

/** Body (`body`), secondary and caption (`muted`) text. */
export const ContentText = ({ tone, className, ...props }: ContentTextProps) => (
  <p className={cn(contentTextVariants({ tone }), className)} {...props} />
);
