import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Topnav / dropdown panel — prototype `DD_PANEL`, shadow via `shadow-float` (UX-03). */
export const SHELL_NAV_DROPDOWN_PANEL =
  "absolute top-full z-50 mt-1.5 min-w-64 origin-top rounded-xl border border-line bg-surface p-1.5 shadow-float";

/** Shared topnav control metrics — `Button` size `nav` (h-9), shell-specific color states below. */
export const SHELL_TOPNAV_TRIGGER = cn(
  buttonVariants({ variant: "ghost", size: "nav" }),
  "active:scale-100 motion-reduce:active:scale-100 transition-[background-color,color] duration-100",
);

export const shellTopNavTriggerClass = (options: {
  isActive: boolean;
  isOpen: boolean;
}): string => {
  const { isActive, isOpen } = options;
  if (isActive) {
    return cn(SHELL_TOPNAV_TRIGGER, "bg-cobalt-soft font-bold text-cobalt-ink");
  }
  if (isOpen) return cn(SHELL_TOPNAV_TRIGGER, "bg-paper text-ink");
  return cn(SHELL_TOPNAV_TRIGGER, "text-ink-2 hover:bg-paper hover:text-ink");
};
