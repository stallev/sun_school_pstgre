import type { UserRole } from "@sunschool/domain";
import { USER_ROLE } from "@sunschool/domain";
import { routeRoles } from "@sunschool/policy-edge";
import {
  isResolvedNavGroup,
  type ResolvedNavItem,
  type ResolvedNavLeaf,
} from "@/lib/shell/nav-resolver";

const ADMIN_OR_TEACHER = [USER_ROLE.ADMIN, USER_ROLE.TEACHER] as const;
const TEACHER_ONLY = [USER_ROLE.TEACHER] as const;
const TEACHER_ADMIN_PARENT = [USER_ROLE.TEACHER, USER_ROLE.ADMIN, USER_ROLE.PARENT] as const;

/**
 * Page-guard roles for shell nav hrefs (requireRole on `*PageContent.server.tsx`).
 * Overrides `route-table.ts` where the server guard is wider (ADR-019 Q-2).
 */
const NAV_HREF_PAGE_GUARD_ROLES: Readonly<Record<string, readonly UserRole[]>> = {
  "/today": ADMIN_OR_TEACHER,
  "/lessons": ADMIN_OR_TEACHER,
  "/check": ADMIN_OR_TEACHER,
  "/verses": ADMIN_OR_TEACHER,
  "/group": TEACHER_ONLY,
  "/bricks": ADMIN_OR_TEACHER,
  "/rating": ADMIN_OR_TEACHER,
  "/calendar": TEACHER_ADMIN_PARENT,
  "/analytics": ADMIN_OR_TEACHER,
};

/** Allowed roles for opening the page behind a nav href (menu predicate = page access). */
export const resolveNavPageAllowedRoles = (href: string): readonly UserRole[] | null => {
  const pageGuard = NAV_HREF_PAGE_GUARD_ROLES[href];
  if (pageGuard) return pageGuard;
  return routeRoles(href);
};

export const canRealRolesAccessNavHref = (
  realRoles: readonly UserRole[],
  href: string,
): boolean => {
  const allowed = resolveNavPageAllowedRoles(href);
  if (!allowed || allowed.length === 0) return true;
  return allowed.some((role) => realRoles.includes(role));
};

const markLeafAccess = (leaf: ResolvedNavLeaf, realRoles: readonly UserRole[]): ResolvedNavLeaf => {
  if (canRealRolesAccessNavHref(realRoles, leaf.href)) {
    const { navDisabled: _removed, ...reachable } = leaf;
    return reachable;
  }
  return { ...leaf, navDisabled: true };
};

const filterLeafHidden = (leaf: ResolvedNavLeaf, realRoles: readonly UserRole[]): ResolvedNavLeaf | null =>
  canRealRolesAccessNavHref(realRoles, leaf.href) ? leaf : null;

/** Keeps nav entries the real session roles may open (main menu, global_shell_spec S-1). */
export const filterNavItemsByRealAccess = (
  items: ResolvedNavItem[],
  realRoles: readonly UserRole[],
): ResolvedNavItem[] => {
  const filtered: ResolvedNavItem[] = [];
  for (const item of items) {
    if (!isResolvedNavGroup(item)) {
      const leaf = filterLeafHidden(item, realRoles);
      if (leaf) filtered.push(leaf);
      continue;
    }
    const children = item.children.flatMap((child) => {
      const leaf = filterLeafHidden(child, realRoles);
      return leaf ? [leaf] : [];
    });
    if (children.length > 0) filtered.push({ ...item, children });
  }
  return filtered;
};

/** Preview menu: show all items for the preview role; mark blocked routes inactive (shell R-15). */
export const applyPreviewNavAccess = (
  items: ResolvedNavItem[],
  realRoles: readonly UserRole[],
): ResolvedNavItem[] =>
  items.map((item) => {
    if (!isResolvedNavGroup(item)) return markLeafAccess(item, realRoles);
    return { ...item, children: item.children.map((child) => markLeafAccess(child, realRoles)) };
  });

export const countReachableNavLeaves = (items: ResolvedNavItem[]): number => {
  let count = 0;
  for (const item of items) {
    if (isResolvedNavGroup(item)) {
      for (const child of item.children) {
        if (!child.navDisabled) count += 1;
      }
    } else if (!item.navDisabled) count += 1;
  }
  return count;
};

export const listNavLeafHrefs = (items: ResolvedNavItem[]): { href: string; navDisabled?: boolean }[] => {
  const rows: { href: string; navDisabled?: boolean }[] = [];
  for (const item of items) {
    if (isResolvedNavGroup(item)) {
      for (const child of item.children) rows.push({ href: child.href, navDisabled: child.navDisabled });
    } else rows.push({ href: item.href, navDisabled: item.navDisabled });
  }
  return rows;
};
