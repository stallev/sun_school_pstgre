"use client";

import { USER_ROLE, type UserRole } from "@sunschool/domain";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { TopNav } from "@/components/shell/top-nav";
import type { NavBadgeCounts } from "@/components/shell/shell-nav-types";
import type { ResolvedNavItem } from "@/lib/shell/nav-resolver";
import { resolveActiveGroupKey, resolveActiveNavKey } from "@/lib/shell/nav-resolver";

type ShellNavigationProps = {
  shellRole: UserRole;
  navItems: ResolvedNavItem[];
  previewNavItems?: ResolvedNavItem[];
  badgeCounts: NavBadgeCounts;
  showDevSwitcher: boolean;
  previewRole: UserRole;
};

/** Desktop topnav only — drawer trigger lives in `shell-header`. */
export const ShellNavigation = ({
  shellRole,
  navItems,
  previewNavItems,
  badgeCounts,
  showDevSwitcher,
  previewRole,
}: ShellNavigationProps) => {
  const pathname = usePathname();

  const displayItems = useMemo(() => {
    if (!showDevSwitcher || !previewNavItems) return navItems;
    return previewRole === USER_ROLE.TEACHER ? previewNavItems : navItems;
  }, [navItems, previewNavItems, previewRole, showDevSwitcher]);

  const activeKey = resolveActiveNavKey(pathname, shellRole);
  const activeGroupKey = resolveActiveGroupKey(displayItems, activeKey);

  const navProps = {
    items: displayItems,
    pathname,
    activeKey,
    activeGroupKey,
    badgeCounts,
  };

  return (
    <div className="hidden min-w-0 flex-1 lg:flex lg:items-center lg:justify-start">
      <TopNav {...navProps} />
    </div>
  );
};
