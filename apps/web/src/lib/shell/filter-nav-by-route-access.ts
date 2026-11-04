import type { UserRole } from "@sunschool/domain";
import { routeRoles } from "@sunschool/policy-edge";
import {
  isResolvedNavGroup,
  type ResolvedNavItem,
  type ResolvedNavLeaf,
} from "@/lib/shell/nav-resolver";

export const canRealRolesAccessNavHref = (
  realRoles: readonly UserRole[],
  href: string,
): boolean => {
  const allowed = routeRoles(href);
  if (!allowed || allowed.length === 0) return true;
  return allowed.some((role) => realRoles.includes(role));
};

const filterLeaf = (leaf: ResolvedNavLeaf, realRoles: readonly UserRole[]): ResolvedNavLeaf | null =>
  canRealRolesAccessNavHref(realRoles, leaf.href) ? leaf : null;

/** Keeps nav entries the real session roles may open (global_shell_spec §8, R-14). */
export const filterNavItemsByRealAccess = (
  items: ResolvedNavItem[],
  realRoles: readonly UserRole[],
): ResolvedNavItem[] => {
  const filtered: ResolvedNavItem[] = [];
  for (const item of items) {
    if (!isResolvedNavGroup(item)) {
      const leaf = filterLeaf(item, realRoles);
      if (leaf) filtered.push(leaf);
      continue;
    }
    const children = item.children.flatMap((child) => {
      const leaf = filterLeaf(child, realRoles);
      return leaf ? [leaf] : [];
    });
    if (children.length > 0) filtered.push({ ...item, children });
  }
  return filtered;
};
