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
  descriptionMessageKey?: string;
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
      {
        key: "lessons-all",
        messageKey: "shell.nav.lessons_all",
        descriptionMessageKey: "shell.nav.desc.lessons_all",
        href: "/lessons",
      },
      {
        key: "check",
        messageKey: "shell.nav.check",
        descriptionMessageKey: "shell.nav.desc.check",
        href: "/check",
      },
      {
        key: "verses",
        messageKey: "shell.nav.verses",
        descriptionMessageKey: "shell.nav.desc.verses",
        href: "/verses",
      },
    ],
  },
  {
    key: "group",
    messageKey: "shell.nav.groups.group",
    children: [
      {
        key: "group-roster",
        messageKey: "shell.nav.group_roster",
        descriptionMessageKey: "shell.nav.desc.group_roster",
        href: "/group",
      },
      {
        key: "bricks",
        messageKey: "shell.nav.bricks",
        descriptionMessageKey: "shell.nav.desc.bricks",
        href: "/bricks",
      },
      {
        key: "rating",
        messageKey: "shell.nav.rating",
        descriptionMessageKey: "shell.nav.desc.rating",
        href: "/rating",
      },
      {
        key: "calendar",
        messageKey: "shell.nav.calendar",
        descriptionMessageKey: "shell.nav.desc.calendar",
        href: "/calendar",
      },
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
      {
        key: "analytics",
        messageKey: "shell.nav.analytics_groups",
        descriptionMessageKey: "shell.nav.desc.analytics_groups",
        href: "/analytics",
      },
      {
        key: "rating",
        messageKey: "shell.nav.rating",
        descriptionMessageKey: "shell.nav.desc.rating_admin",
        href: "/rating",
      },
      {
        key: "audit",
        messageKey: "shell.nav.audit",
        descriptionMessageKey: "shell.nav.desc.audit",
        href: "/audit",
      },
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
        descriptionMessageKey: "shell.nav.desc.approvals",
        href: "/approvals",
        badgeSlotId: NAV_BADGE_SLOT.APPROVALS,
      },
      {
        key: "users",
        messageKey: "shell.nav.users",
        descriptionMessageKey: "shell.nav.desc.users",
        href: "/users",
      },
      {
        key: "people",
        messageKey: "shell.nav.people",
        descriptionMessageKey: "shell.nav.desc.people",
        href: "/people",
      },
      {
        key: "deletions",
        messageKey: "shell.nav.deletions",
        descriptionMessageKey: "shell.nav.desc.deletions",
        href: "/deletions",
      },
      {
        key: "bricks",
        messageKey: "shell.nav.bricks",
        descriptionMessageKey: "shell.nav.desc.bricks",
        href: "/bricks",
      },
    ],
  },
  {
    key: "study",
    messageKey: "shell.nav.groups.study",
    children: [
      {
        key: "groups",
        messageKey: "shell.nav.groups_admin",
        descriptionMessageKey: "shell.nav.desc.groups_admin",
        href: "/groups",
      },
      {
        key: "year",
        messageKey: "shell.nav.year",
        descriptionMessageKey: "shell.nav.desc.year",
        href: "/year",
      },
      {
        key: "calendar",
        messageKey: "shell.nav.calendar",
        descriptionMessageKey: "shell.nav.desc.calendar",
        href: "/calendar",
      },
      {
        key: "achievements",
        messageKey: "shell.nav.achievements",
        descriptionMessageKey: "shell.nav.desc.achievements",
        href: "/achievements",
      },
      {
        key: "verses",
        messageKey: "shell.nav.verses",
        descriptionMessageKey: "shell.nav.desc.verses",
        href: "/verses",
      },
      {
        key: "settings",
        messageKey: "shell.nav.settings",
        descriptionMessageKey: "shell.nav.desc.settings",
        href: "/settings",
      },
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
  { pattern: /^\/lessons$/, navKey: "lessons-all" },
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
  { pattern: /^\/achievements$/, navKey: "achievements" },
  { pattern: /^\/groups(\/|$)/, navKey: "groups" },
  { pattern: /^\/year$/, navKey: "year" },
  { pattern: /^\/settings$/, navKey: "settings" },
];
