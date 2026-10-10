import { cva, type VariantProps } from "class-variance-authority";

/**
 * Single source of truth for all body-text scales.
 *
 *  Adjust sizes / weights / colors here — never override via className
 *  in product screens. If you find yourself repeating the same className
 *  override across files, add a new variant instead.
 *
 *  `className` on <ContentText> is for LAYOUT only (margin, width, flex).
 */
export const contentTextVariants = cva("font-sans", {
  variants: {
    variant: {
      /* Primary body copy */
      body:                 "text-base text-foreground leading-relaxed",
      bodyMuted:            "text-base text-muted-foreground leading-relaxed",

      /* Page hero / intro */
      subtitleLg:           "text-lg font-medium text-foreground leading-snug",
      lead:                 "text-lg text-muted-foreground leading-relaxed",

      /* Small */
      small:                "text-sm text-foreground leading-normal",
      smallEmphasis:        "text-sm font-medium text-foreground leading-normal",
      muted:                "text-sm text-muted-foreground leading-normal",
      subtle:               "text-sm text-subtle-foreground leading-normal",

      /* Micro */
      mutedMicro:           "text-xs text-muted-foreground leading-normal",
      hint:                 "text-xs text-subtle-foreground leading-normal",
      subtleFine:           "text-[13px] text-subtle-foreground leading-normal",

      /* Cards & blocks */
      blockLabel:           "text-xs font-medium text-foreground leading-tight",
      statusLabel:          "text-xs font-semibold text-primary leading-tight uppercase tracking-wide",
      smallEmphasisPrimary: "text-sm font-medium text-primary leading-normal",
      eyebrowOnBrand:       "text-xs font-mono uppercase tracking-wider text-primary",

      /* Long-form reading (passages, articles) */
      passageTriggerTitle:  "font-heading text-[13px] leading-snug text-foreground",
      verseReading:         "text-[13px] leading-relaxed text-foreground",

      /* Stats / numbers */
      statValue:            "font-heading text-3xl tabular-nums leading-none text-foreground",
      streakSecondary:      "text-[11px] text-muted-foreground leading-tight",

      /* Captions */
      caption:              "text-xs uppercase tracking-wider font-medium text-muted-foreground",
    },
  },
  defaultVariants: { variant: "bodyMuted" },
});

export type ContentTextVariant = NonNullable<
  VariantProps<typeof contentTextVariants>["variant"]
>;
