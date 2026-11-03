import { cn } from "@/lib/utils";

/** Shared by `#view` and the header right cluster (ADR-017 §4.1, UX-02 §3). */
export const shellViewContainerClassName =
  "mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8";

export const shellGridClassName = (sidebarCollapsed: boolean): string =>
  cn(
    "mx-auto w-full max-w-[1600px] flex-1 lg:grid lg:transition-[grid-template-columns] duration-200 ease-out-soft motion-reduce:transition-none",
    sidebarCollapsed
      ? "lg:grid-cols-[4rem_minmax(0,1fr)]"
      : "lg:grid-cols-[16rem_minmax(0,1fr)]",
  );

export const shellRailDataAttribute = (sidebarCollapsed: boolean): "collapsed" | "expanded" =>
  sidebarCollapsed ? "collapsed" : "expanded";
