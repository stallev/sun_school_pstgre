/** Design Lab L2 data: variant × state matrices (spec §7). Names mirror the component catalog. */

export const BUTTON_VARIANTS = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "destructive-solid",
  "link",
] as const;

export const BUTTON_SIZES = [
  "default",
  "compact",
  "touch",
  "icon",
  "icon-compact",
  "icon-touch",
] as const;

export type FieldState = "default" | "focus" | "disabled" | "invalid" | "pending";

export const FIELD_STATES: readonly { id: FieldState; label: string }[] = [
  { id: "default", label: "default" },
  { id: "focus", label: "focus" },
  { id: "disabled", label: "disabled" },
  { id: "invalid", label: "invalid" },
  { id: "pending", label: "pending" },
];

export const BADGE_VARIANTS = ["default", "secondary", "outline", "destructive", "ghost"] as const;

export const STATUS_TONES = ["neutral", "ok", "warn", "danger", "info"] as const;

export const BANNER_TONES = ["info", "success", "warning", "error"] as const;

export const SCORE_MAX = 5;
