import type { VariantProps } from "class-variance-authority";

import type { ContentTextVariant } from "@/components/atoms/content-text-variants";
import { pulseCardVariants } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

/** Sync with `buttonVariants` when CVA changes. */
export const BUTTON_VARIANTS = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "tonal",
  "destructive",
  "link",
] as const satisfies NonNullable<
  VariantProps<typeof buttonVariants>["variant"]
>[];

export const BUTTON_SIZES = [
  "xs",
  "sm",
  "default",
  "lg",
  "icon",
  "icon-xs",
  "icon-sm",
  "icon-lg",
] as const satisfies NonNullable<
  VariantProps<typeof buttonVariants>["size"]
>[];

export const BUTTON_MATRIX_SIZES = ["default", "sm", "icon"] as const;

export const BUTTON_STATES = ["default", "disabled", "loading"] as const;

export const CONTENT_TEXT_VARIANTS = [
  "body",
  "bodyMuted",
  "subtitleLg",
  "lead",
  "small",
  "smallEmphasis",
  "muted",
  "metaSecondary",
  "metaPrimary",
  "subtle",
  "mutedMicro",
  "hint",
  "subtleFine",
  "blockLabel",
  "statusLabel",
  "caption",
  "smallEmphasisPrimary",
  "eyebrowOnBrand",
  "statValue",
] as const satisfies ContentTextVariant[];

export const HEADING_VISUAL_LEVELS = [
  "display",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
] as const;

/** Sync with `pulseCardVariants` when CVA changes. */
export const PULSECARD_VARIANTS = [
  "base",
  "elevated",
  "compact",
  "row",
] as const satisfies NonNullable<
  VariantProps<typeof pulseCardVariants>["variant"]
>[];

export const PULSECARD_STATES = [
  "default",
  "active",
  "warning",
  "muted",
] as const satisfies NonNullable<
  VariantProps<typeof pulseCardVariants>["state"]
>[];

export const LINK_DEMOS = [
  { as: "text" as const, variant: undefined, label: "text / default" },
  { as: "text" as const, variant: "action" as const, label: "text / action" },
  { as: "text" as const, variant: "quiet" as const, label: "text / quiet" },
  { as: "button" as const, variant: "default" as const, label: "button / default" },
  { as: "button" as const, variant: "outline" as const, label: "button / outline" },
  { as: "icon" as const, variant: "ghost" as const, label: "icon / ghost" },
];

export const FORM_INPUT_SIZES = ["default", "compact", "search"] as const;

export const FORM_INPUT_STATES = ["default", "error", "disabled"] as const;

/** Sync with `radioGroupItemVariants` when CVA changes. */
export const RADIO_ITEM_VARIANTS = ["default", "tile", "card"] as const;

export const ROLE_TILE_OPTIONS = [
  { value: "client", label: "Client" },
  { value: "trainer", label: "Trainer" },
] as const;

export const VIEWPORT_WIDTHS = [390, 768, 1280] as const;

export const RATING_STAR_SIZES = ["sm", "md", "lg"] as const;

export const AVATAR_SIZES = [
  "xs",
  "sm",
  "default",
  "md",
  "lg",
  "xl",
  "2xl",
] as const;

export const FILTER_CHIP_OPTIONS = [
  { id: "all", label: "All" },
  { id: "cardio", label: "Cardio" },
  { id: "strength", label: "Strength" },
  { id: "hiit", label: "HIIT" },
  { id: "pilates", label: "Pilates" },
] as const;

export const STATUS_BADGE_MATRIX = [
  { status: "confirmed" as const, label: "Confirmed" },
  { status: "pending" as const, label: "Pending" },
  { status: "cancelled" as const, label: "Cancelled" },
  { status: "completed" as const, label: "Completed" },
  { status: "info" as const, label: "Info" },
] as const;

export const SCHEDULE_DAYS_FIXTURE = [
  { id: "d1", weekday: "Mon", day: "20" },
  { id: "d2", weekday: "Tue", day: "21" },
  { id: "d3", weekday: "Wed", day: "22" },
  { id: "d4", weekday: "Thu", day: "23" },
  { id: "d5", weekday: "Fri", day: "24" },
  { id: "d6", weekday: "Sat", day: "25" },
  { id: "d7", weekday: "Sun", day: "26" },
] as const;

export const SCHEDULE_SLOTS_FIXTURE = [
  { id: "s1", label: "07:00", available: true },
  { id: "s2", label: "08:30", available: false },
  { id: "s3", label: "10:00", available: true },
  { id: "s4", label: "11:30", available: true },
  { id: "s5", label: "13:00", available: false },
  { id: "s6", label: "15:00", available: true },
] as const;

export const SERVICE_CHOICES_FIXTURE = [
  { id: "s1", name: "Morning HIIT", duration: 60, price: 40 },
  { id: "s2", name: "Strength circuit", duration: 75, price: 55 },
  { id: "s3", name: "Core strength", duration: 45, price: 35 },
] as const;

export const LAB_SECTIONS = [
  { id: "tokens", label: "Tokens" },
  { id: "settings", label: "Settings" },
  { id: "typography", label: "Typography" },
  { id: "buttons", label: "Buttons" },
  { id: "links", label: "Links" },
  { id: "cards", label: "Cards" },
  { id: "forms", label: "Forms" },
  { id: "toasts", label: "Toasts" },
  { id: "modals", label: "Modals" },
  { id: "media", label: "Media" },
  { id: "patterns", label: "Patterns" },
  { id: "catalog-patterns", label: "Catalog" },
  { id: "marketing", label: "Marketing" },
] as const;
