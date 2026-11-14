export const SIDEBAR_COLLAPSED_COOKIE_NAME = "sidebar_collapsed";

/** `auto` = no explicit choice: rail on `lg`, expanded from `xl` (ADR-022 §4.1). */
export type SidebarPreference = "collapsed" | "expanded" | "auto";

/** Server: `cookies().get(name)?.value` — `1` collapsed, `0` expanded, anything else → no choice. */
export const parseSidebarPreferenceCookie = (value: string | undefined): SidebarPreference => {
  if (value === "1") return "collapsed";
  if (value === "0") return "expanded";
  return "auto";
};

/** Client: persist UI preference (not HttpOnly). */
export const writeSidebarCollapsedCookie = (collapsed: boolean): void => {
  if (typeof document === "undefined") return;
  const flag = collapsed ? "1" : "0";
  document.cookie = `${SIDEBAR_COLLAPSED_COOKIE_NAME}=${flag}; Path=/; Max-Age=31536000; SameSite=Lax`;
};
