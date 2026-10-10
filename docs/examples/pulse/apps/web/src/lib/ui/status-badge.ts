export const STATUS_BADGE_VARIANTS = [
  "confirmed",
  "completed",
  "cancelled",
  "pending",
  "verified",
  "info",
  "noShow",
  "neutral",
] as const;

export type StatusBadgeVariant = (typeof STATUS_BADGE_VARIANTS)[number];

export const STATUS_BADGE_CLASSES: Record<StatusBadgeVariant, string> = {
  confirmed:
    "bg-[hsl(var(--color-success-container))] text-[color:var(--green-text)]",
  completed:
    "bg-[hsl(var(--color-surface-variant))] text-[hsl(var(--color-ink-2))]",
  cancelled:
    "bg-[hsl(var(--color-error-container))] text-[hsl(var(--color-error))]",
  pending:
    "bg-[hsl(var(--color-warning-container))] text-[hsl(var(--color-warning))]",
  verified: "bg-primary-container text-on-primary-container",
  info: "bg-[hsl(var(--color-info-container))] text-[hsl(var(--color-info))]",
  noShow:
    "bg-[hsl(var(--color-error-container))]/60 text-[hsl(var(--color-error))]",
  neutral:
    "bg-[hsl(var(--color-surface-variant))] text-[hsl(var(--color-ink-2))]",
};
