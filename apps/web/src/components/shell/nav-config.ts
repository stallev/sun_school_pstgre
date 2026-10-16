import { USER_ROLE, type UserRole } from "@sunschool/domain";

/** Badge slot ids — counts are loaded on the server for admin only. */
export const NAV_BADGE_SLOT = {
  APPROVALS: "approvals",
  PEOPLE_GROUP: "peopleGroup",
} as const;
export type NavBadgeSlotId = (typeof NAV_BADGE_SLOT)[keyof typeof NAV_BADGE_SLOT];

export type NavLeafDef = {
  key: string;
  messageKey: string;
  href: string;
  badgeSlotId?: NavBadgeSlotId;
};

export type NavGroupDef = {
  key: string;
  messageKey: string;
  children: NavLeafDef[];
  badgeSlotId?: NavBadgeSlotId;
};

export type NavEntryDef = NavLeafDef | NavGroupDef;

export const isNavGroup = (entry: NavEntryDef): entry is NavGroupDef => "children" in entry;

/** Prototype `NAV_ALIAS` — maps route “view” keys to a nav group / top item key. */
export const NAV_ALIAS: Record<string, string> = {
  lesson: "lessons",
  lessonForm: "lessons",
  lessonTable: "lessons",
  pupil: "analytics",
  groupEdit: "groups",
  userProfile: "users",
  family: "people",
};

const TEACHER_NAV: NavEntryDef[] = [
  { key: "today", messageKey: "shell.nav.today", href: "/today" },
  {
    key: "lessons",
    messageKey: "shell.nav.groups.lessons",
    children: [
      { key: "lessons-all", messageKey: "shell.nav.lessons_all", href: "/lessons" },
      { key: "check", messageKey: "shell.nav.check", href: "/check" },
      { key: "verses", messageKey: "shell.nav.verses", href: "/verses" },
    ],
  },
  {
    key: "group",
    messageKey: "shell.nav.groups.group",
    children: [
      { key: "group-roster", messageKey: "shell.nav.group_roster", href: "/group" },
      { key: "bricks", messageKey: "shell.nav.bricks", href: "/bricks" },
      { key: "rating", messageKey: "shell.nav.rating", href: "/rating" },
      { key: "calendar", messageKey: "shell.nav.calendar", href: "/calendar" },
    ],
  },
  { key: "analytics", messageKey: "shell.nav.analytics", href: "/analytics" },
];

const ADMIN_NAV: NavEntryDef[] = [
  { key: "school", messageKey: "shell.nav.school", href: "/school" },
  {
    key: "analytics",
    messageKey: "shell.nav.groups.analytics",
    children: [
      { key: "analytics", messageKey: "shell.nav.analytics", href: "/analytics" },
      { key: "rating", messageKey: "shell.nav.rating", href: "/rating" },
      { key: "audit", messageKey: "shell.nav.audit", href: "/audit" },
    ],
  },
  {
    key: "people",
    messageKey: "shell.nav.groups.people",
    badgeSlotId: NAV_BADGE_SLOT.PEOPLE_GROUP,
    children: [
      {
        key: "approvals",
        messageKey: "shell.nav.approvals",
        href: "/approvals",
        badgeSlotId: NAV_BADGE_SLOT.APPROVALS,
      },
      { key: "users", messageKey: "shell.nav.users", href: "/users" },
      { key: "people", messageKey: "shell.nav.people", href: "/people" },
      { key: "deletions", messageKey: "shell.nav.deletions", href: "/deletions" },
      { key: "bricks", messageKey: "shell.nav.bricks", href: "/bricks" },
    ],
  },
  {
    key: "study",
    messageKey: "shell.nav.groups.study",
    children: [
      { key: "groups", messageKey: "shell.nav.groups_admin", href: "/groups" },
      { key: "year", messageKey: "shell.nav.year", href: "/year" },
      { key: "calendar", messageKey: "shell.nav.calendar", href: "/calendar" },
      { key: "verses", messageKey: "shell.nav.verses", href: "/verses" },
      { key: "settings", messageKey: "shell.nav.settings", href: "/settings" },
    ],
  },
];

export const NAV_BY_ROLE: Record<UserRole, NavEntryDef[]> = {
  [USER_ROLE.TEACHER]: TEACHER_NAV,
  [USER_ROLE.ADMIN]: ADMIN_NAV,
  [USER_ROLE.PARENT]: [],
};

/** Path patterns → nav item key for active state (UX-02 §5.4). */
export const NAV_PATH_PATTERNS: ReadonlyArray<{ pattern: RegExp; navKey: string }> = [
  { pattern: /^\/today$/, navKey: "today" },
  { pattern: /^\/school$/, navKey: "school" },
  { pattern: /^\/lessons(\/|$)/, navKey: "lessons" },
  { pattern: /^\/check$/, navKey: "check" },
  { pattern: /^\/group$/, navKey: "group-roster" },
  { pattern: /^\/analytics(\/|$)/, navKey: "analytics" },
  { pattern: /^\/analytics\/pupils\//, navKey: "analytics" },
  { pattern: /^\/rating$/, navKey: "rating" },
  { pattern: /^\/verses$/, navKey: "verses" },
  { pattern: /^\/calendar$/, navKey: "calendar" },
  { pattern: /^\/bricks$/, navKey: "bricks" },
  { pattern: /^\/approvals$/, navKey: "approvals" },
  { pattern: /^\/users(\/|$)/, navKey: "users" },
  { pattern: /^\/people$/, navKey: "people" },
  { pattern: /^\/deletions$/, navKey: "deletions" },
  { pattern: /^\/audit$/, navKey: "audit" },
  { pattern: /^\/groups(\/|$)/, navKey: "groups" },
  { pattern: /^\/year$/, navKey: "year" },
  { pattern: /^\/settings$/, navKey: "settings" },
];
