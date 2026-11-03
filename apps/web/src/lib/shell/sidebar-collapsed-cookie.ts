export const SIDEBAR_COLLAPSED_COOKIE_NAME = "sidebar_collapsed";

/** Server: `cookies().get(name)?.value` — collapsed only when value is exactly `"1"`. */
export const parseSidebarCollapsedCookie = (value: string | undefined): boolean =>
  value === "1";

/** Client: persist UI preference (not HttpOnly). */
export const writeSidebarCollapsedCookie = (collapsed: boolean): void => {
  if (typeof document === "undefined") return;
  const flag = collapsed ? "1" : "0";
  document.cookie = `${SIDEBAR_COLLAPSED_COOKIE_NAME}=${flag}; Path=/; Max-Age=31536000; SameSite=Lax`;
};
