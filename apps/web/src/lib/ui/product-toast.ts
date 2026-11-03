/** Standard Sonner duration after mutations (ui-toast-mutations). */
export const PRODUCT_TOAST_DURATION_MS = 2000;

/** UX-03 D-15 / global_shell_spec §6.5 — shared Sonner classNames. */
export const PRODUCT_TOAST_CLASS_NAMES = {
  toast:
    "rounded-lg border shadow-float w-[min(24rem,calc(100vw-2rem))] motion-reduce:transition-none",
  success: "bg-ok-soft border-ok text-ink",
  error: "bg-danger-soft border-danger text-ink",
  default: "bg-surface border-line text-ink",
} as const;

export const PRODUCT_TOAST_MOBILE_OFFSET = { top: "4rem" } as const;

export const PRODUCT_TOAST_DESKTOP_OFFSET = {
  bottom: "1.5rem",
  right: "1.5rem",
} as const;
