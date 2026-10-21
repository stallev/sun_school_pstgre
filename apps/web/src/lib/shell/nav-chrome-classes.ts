/** Topnav / dropdown panel — prototype `DD_PANEL`, shadow via `shadow-float` (UX-03). */
export const SHELL_NAV_DROPDOWN_PANEL =
  "absolute top-full z-50 mt-1.5 min-w-64 origin-top rounded-xl border border-line bg-surface p-1.5 shadow-float";

export const SHELL_TOPNAV_TRIGGER =
  "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[0.9375rem] transition-[background-color,color] duration-100";

export const shellTopNavTriggerClass = (options: {
  isActive: boolean;
  isOpen: boolean;
}): string => {
  const { isActive, isOpen } = options;
  if (isActive) return `${SHELL_TOPNAV_TRIGGER} bg-cobalt-soft font-bold text-cobalt-ink`;
  if (isOpen) return `${SHELL_TOPNAV_TRIGGER} bg-paper text-ink`;
  return `${SHELL_TOPNAV_TRIGGER} text-ink-2 hover:bg-paper hover:text-ink`;
};
