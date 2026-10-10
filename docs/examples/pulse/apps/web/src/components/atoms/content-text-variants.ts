import { cva, type VariantProps } from "class-variance-authority";

/**
 * Single source of truth for all body-text scales.
 * Sizes aligned with Fitness_Platform_Prototype_v1.html (ink-2/3, KPI, captions).
 *
 * `className` on <ContentText> is for LAYOUT only (margin, width, flex).
 */
export const contentTextVariants = cva("font-sans", {
  variants: {
    variant: {
      body: "text-[15px] text-foreground leading-relaxed",
      bodyMuted: "text-[15px] text-muted-foreground leading-relaxed",
      subtitleLg: "text-lg font-medium text-foreground leading-snug",
      lead: "text-lg text-muted-foreground leading-relaxed",
      small: "text-[13px] text-foreground leading-normal",
      smallEmphasis: "text-[15px] font-medium text-foreground leading-normal",
      muted: "text-[12px] text-muted-foreground leading-normal",
      /** Booking card service line — prototype `text-[12.5px] text-ink-2` */
      metaSecondary:
        "text-[12.5px] text-muted-foreground leading-normal",
      /** Booking card datetime — prototype `text-[12px] text-primary font-medium` */
      metaPrimary:
        "text-[12px] font-medium text-primary leading-normal",
      subtle: "text-[13px] text-subtle-foreground leading-normal",
      mutedMicro: "text-[11px] text-muted-foreground leading-normal",
      hint: "text-[11px] text-subtle-foreground leading-normal",
      subtleFine: "text-[13px] text-subtle-foreground leading-normal",
      blockLabel: "text-[13px] font-medium text-foreground leading-tight",
      statusLabel:
        "text-[12px] font-semibold text-primary leading-tight uppercase tracking-wide",
      smallEmphasisPrimary:
        "text-[12px] font-medium text-primary leading-normal",
      eyebrowOnBrand:
        "text-[11px] font-mono uppercase tracking-wider text-primary",
      statValue:
        "font-heading text-[20px] md:text-[22px] tabular-nums leading-none text-foreground",
      caption:
        "text-[12px] uppercase tracking-wider font-medium text-muted-foreground",
    },
  },
  defaultVariants: { variant: "bodyMuted" },
});

export type ContentTextVariant = NonNullable<
  VariantProps<typeof contentTextVariants>["variant"]
>;
