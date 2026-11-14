import type { SidebarPreference } from "@/lib/shell/sidebar-collapsed-cookie";
import { cn } from "@/lib/utils";

/** Shared by `#view` and the header right cluster (ADR-017 §4.1, UX-02 §3). */
export const shellViewContainerClassName =
  "mx-auto w-full max-w-[1600px] px-page";

/** Rail below `xl` and expanded from `xl` when the user made no choice (ADR-022 §4.1). */
const GRID_COLUMNS: Record<SidebarPreference, string> = {
  collapsed: "lg:grid-cols-[4rem_minmax(0,1fr)]",
  expanded: "lg:grid-cols-[16rem_minmax(0,1fr)]",
  auto: "lg:grid-cols-[4rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)]",
};

export const shellGridClassName = (preference: SidebarPreference): string =>
  cn(
    "mx-auto w-full max-w-[1600px] flex-1 lg:grid lg:transition-[grid-template-columns] duration-200 ease-out-soft motion-reduce:transition-none",
    GRID_COLUMNS[preference],
  );

export const shellRailDataAttribute = (preference: SidebarPreference): SidebarPreference =>
  preference;
