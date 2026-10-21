"use client";

import { USER_ROLE, type UserRole } from "@sunschool/domain";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { NavDrawer } from "@/components/shell/nav-drawer";
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
  displayName: string;
};

export const ShellNavigation = ({
  shellRole,
  navItems,
  previewNavItems,
  badgeCounts,
  showDevSwitcher,
  displayName,
}: ShellNavigationProps) => {
  const pathname = usePathname();
  const [previewRole, setPreviewRole] = useState<UserRole>(shellRole);
  const [DevRoleSwitcher, setDevRoleSwitcher] = useState<ComponentType<{
    previewRole: UserRole;
    onPreviewRoleChange: (role: UserRole) => void;
  }> | null>(null);

  useEffect(() => {
    if (!showDevSwitcher) return;
    void import("@/components/shell/dev-role-switcher").then((mod) => {
      setDevRoleSwitcher(() => mod.DevRoleSwitcher);
    });
  }, [showDevSwitcher]);

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
    <div className="flex flex-1 items-center justify-center gap-2 lg:justify-start">
      <NavDrawer {...navProps} displayName={displayName} />
      <TopNav {...navProps} />
      {showDevSwitcher && previewNavItems && DevRoleSwitcher ? (
        <DevRoleSwitcher previewRole={previewRole} onPreviewRoleChange={setPreviewRole} />
      ) : null}
    </div>
  );
};
