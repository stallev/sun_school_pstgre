/** Prototype `common.titles.*` keys → resolved on the server into `ShellScreenTitles`. */
export type ShellScreenTitleKey =
  | "today"
  | "lessons"
  | "lesson"
  | "lessonTable"
  | "lessonForm"
  | "check"
  | "analytics"
  | "pupil"
  | "group"
  | "bricks"
  | "rating"
  | "calendar"
  | "verses"
  | "school"
  | "users"
  | "approvals"
  | "people"
  | "deletions"
  | "groups"
  | "groupEdit"
  | "year"
  | "audit"
  | "achievements"
  | "settings"
  | "profile"
  | "userProfile";

const SHELL_TITLE_PATTERNS: ReadonlyArray<{ pattern: RegExp; titleKey: ShellScreenTitleKey }> = [
  { pattern: /^\/today$/, titleKey: "today" },
  { pattern: /^\/school$/, titleKey: "school" },
  { pattern: /^\/lessons\/new$/, titleKey: "lessonForm" },
  { pattern: /^\/lessons\/[^/]+\/edit$/, titleKey: "lessonForm" },
  { pattern: /^\/lessons\/[^/]+\/table$/, titleKey: "lessonTable" },
  { pattern: /^\/lessons\/[^/]+\/check$/, titleKey: "check" },
  { pattern: /^\/lessons\/[^/]+$/, titleKey: "lesson" },
  { pattern: /^\/lessons$/, titleKey: "lessons" },
  { pattern: /^\/check$/, titleKey: "check" },
  { pattern: /^\/group$/, titleKey: "group" },
  { pattern: /^\/analytics\/pupils\/[^/]+$/, titleKey: "pupil" },
  { pattern: /^\/analytics$/, titleKey: "analytics" },
  { pattern: /^\/rating$/, titleKey: "rating" },
  { pattern: /^\/verses$/, titleKey: "verses" },
  { pattern: /^\/calendar$/, titleKey: "calendar" },
  { pattern: /^\/bricks$/, titleKey: "bricks" },
  { pattern: /^\/approvals$/, titleKey: "approvals" },
  { pattern: /^\/users\/[^/]+$/, titleKey: "userProfile" },
  { pattern: /^\/users$/, titleKey: "users" },
  { pattern: /^\/people$/, titleKey: "people" },
  { pattern: /^\/deletions$/, titleKey: "deletions" },
  { pattern: /^\/audit$/, titleKey: "audit" },
  { pattern: /^\/achievements$/, titleKey: "achievements" },
  { pattern: /^\/groups\/[^/]+$/, titleKey: "groupEdit" },
  { pattern: /^\/groups$/, titleKey: "groups" },
  { pattern: /^\/year$/, titleKey: "year" },
  { pattern: /^\/settings$/, titleKey: "settings" },
  { pattern: /^\/profile$/, titleKey: "profile" },
];

export type ShellScreenTitles = Record<ShellScreenTitleKey, string>;

export const resolveShellScreenTitle = (
  pathname: string,
  titles: ShellScreenTitles,
): string | null => {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  for (const { pattern, titleKey } of SHELL_TITLE_PATTERNS) {
    if (pattern.test(path)) return titles[titleKey];
  }
  return null;
};
