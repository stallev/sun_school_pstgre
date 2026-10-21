import { USER_ROLE, type UserRole } from "@sunschool/domain";
import {
  isNavGroup,
  NAV_BY_ROLE,
  NAV_PATH_PATTERNS,
  type NavBadgeSlotId,
  type NavEntryDef,
  type NavGroupDef,
  type NavLeafDef,
} from "@/components/shell/nav-config";

export type ResolvedNavLeaf = {
  key: string;
  label: string;
  description?: string;
  href: string;
  badgeSlotId?: NavBadgeSlotId;
};

export type ResolvedNavGroup = {
  key: string;
  label: string;
  children: ResolvedNavLeaf[];
  badgeSlotId?: NavBadgeSlotId;
};

export type ResolvedNavItem = ResolvedNavLeaf | ResolvedNavGroup;

export const isResolvedNavGroup = (item: ResolvedNavItem): item is ResolvedNavGroup => "children" in item;

/** Admin wins when both roles are held (global_shell_spec §5, Q-05). */
export const resolveShellRole = (roles: readonly UserRole[]): UserRole => {
  if (roles.includes(USER_ROLE.ADMIN)) return USER_ROLE.ADMIN;
  return USER_ROLE.TEACHER;
};

export const resolveNavDefs = (role: UserRole): NavEntryDef[] => NAV_BY_ROLE[role];

const resolveLeaf = (
  leaf: NavLeafDef,
  label: string,
  description: string | undefined,
): ResolvedNavLeaf => ({
  key: leaf.key,
  label,
  description,
  href: leaf.href,
  badgeSlotId: leaf.badgeSlotId,
});

const resolveGroup = (group: NavGroupDef, label: string, childLabels: ResolvedNavLeaf[]): ResolvedNavGroup => ({
  key: group.key,
  label,
  children: childLabels,
  badgeSlotId: group.badgeSlotId,
});

/** Builds client nav DTO with pre-resolved labels (ADR-008 §4.3). */
export const resolveNavItems = (
  role: UserRole,
  getLabel: (messageKey: string) => string,
): ResolvedNavItem[] =>
  resolveNavDefs(role).map((entry) => {
    if (isNavGroup(entry)) {
      const children = entry.children.map((child) =>
        resolveLeaf(
          child,
          getLabel(child.messageKey),
          child.descriptionMessageKey ? getLabel(child.descriptionMessageKey) : undefined,
        ),
      );
      return resolveGroup(entry, getLabel(entry.messageKey), children);
    }
    return resolveLeaf(entry, getLabel(entry.messageKey), undefined);
  });

export const normalizePathname = (pathname: string): string => {
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return trimmed.startsWith("/") ? trimmed || "/" : `/${trimmed}`;
};

/** Nav item key for highlighting (leaf key or group key). */
export const resolveActiveNavKey = (pathname: string, _role: UserRole): string | null => {
  const path = normalizePathname(pathname);
  for (const { pattern, navKey } of NAV_PATH_PATTERNS) {
    if (pattern.test(path)) return navKey;
  }
  return null;
};

const groupContainsKey = (group: ResolvedNavGroup, key: string): boolean =>
  group.children.some((child) => child.key === key) || group.key === key;

export const isNavLeafActive = (leaf: ResolvedNavLeaf, activeKey: string | null): boolean =>
  activeKey !== null && leaf.key === activeKey;

export const isNavGroupActive = (group: ResolvedNavGroup, activeKey: string | null): boolean => {
  if (!activeKey) return false;
  if (group.key === activeKey) return true;
  return groupContainsKey(group, activeKey);
};

/** Maps active leaf to parent group key for topnav group highlight. */
export const resolveActiveGroupKey = (items: ResolvedNavItem[], activeKey: string | null): string | null => {
  if (!activeKey) return null;
  for (const item of items) {
    if (!isResolvedNavGroup(item)) {
      if (item.key === activeKey) return null;
      continue;
    }
    if (isNavGroupActive(item, activeKey)) return item.key;
  }
  return null;
};
