"use client";

import { USER_ROLE, type UserRole } from "@sunschool/domain";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { BrandMark } from "@/components/patterns/BrandMark";
import { CustomLink } from "@/components/ui/custom-link";
import { NavDrawer } from "@/components/shell/nav-drawer";
import { ShellNavigation } from "@/components/shell/shell-navigation.client";
import { UserMenu } from "@/components/shell/user-menu";
import type { NavBadgeCounts } from "@/components/shell/shell-nav-types";
import { useShellMessages } from "@/components/shell/shell-messages-provider.client";
import type { ShellNavPayload } from "@/data/shell/build-shell-nav.server";
import { resolveActiveGroupKey, resolveActiveNavKey } from "@/lib/shell/nav-resolver";
import { resolveShellScreenTitle } from "@/lib/shell/shell-screen-title";

type ShellHeaderProps = {
  homeHref: string;
  displayName: string;
  nav: ShellNavPayload;
  badgeCounts: NavBadgeCounts;
};

export const ShellHeader = ({ homeHref, displayName, nav, badgeCounts }: ShellHeaderProps) => {
  const messages = useShellMessages();
  const pathname = usePathname();
  const [previewRole, setPreviewRole] = useState<UserRole>(nav.shellRole);
  const [DevRoleSwitcher, setDevRoleSwitcher] = useState<ComponentType<{
    previewRole: UserRole;
    onPreviewRoleChange: (role: UserRole) => void;
  }> | null>(null);

  useEffect(() => {
    if (!nav.showDevSwitcher) return;
    void import("@/components/shell/dev-role-switcher").then((mod) => {
      setDevRoleSwitcher(() => mod.DevRoleSwitcher);
    });
  }, [nav.showDevSwitcher]);

  const screenTitle =
    resolveShellScreenTitle(pathname, messages.screenTitles) ?? messages.brand;
  const roleName =
    nav.shellRole === USER_ROLE.ADMIN ? messages.roleNameAdmin : messages.roleNameTeacher;
  const resolvedName = displayName || messages.displayNameFallback;

  const displayItems = useMemo(() => {
    if (!nav.showDevSwitcher || !nav.previewNavItems) return nav.navItems;
    return previewRole === USER_ROLE.TEACHER ? nav.previewNavItems : nav.navItems;
  }, [nav.navItems, nav.previewNavItems, nav.showDevSwitcher, previewRole]);

  const activeKey = resolveActiveNavKey(pathname, nav.shellRole);
  const activeGroupKey = resolveActiveGroupKey(displayItems, activeKey);

  const drawerProps = {
    items: displayItems,
    pathname,
    activeKey,
    activeGroupKey,
    badgeCounts,
    displayName: resolvedName,
    roleName,
  };

  return (
    <header className="sticky top-0 z-40 overflow-visible border-b border-line bg-surface/90 backdrop-blur-md reduce-transparency:bg-surface reduce-transparency:backdrop-blur-none">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-2 px-2 sm:px-4 lg:gap-4 lg:px-8">
        <NavDrawer {...drawerProps} />
        <CustomLink href={homeHref} className="min-w-0 flex-1 shrink no-underline lg:shrink-0 lg:flex-none">
          <span className="lg:hidden">
            <span className="block truncate font-display text-lg font-medium leading-tight text-ink">
              {screenTitle}
            </span>
            <span className="block truncate text-xs text-muted">
              {resolvedName} · {roleName}
            </span>
          </span>
          <span className="hidden lg:inline-flex">
            <BrandMark brandName={messages.brand} />
          </span>
        </CustomLink>
        <ShellNavigation
          shellRole={nav.shellRole}
          navItems={nav.navItems}
          previewNavItems={nav.previewNavItems}
          badgeCounts={badgeCounts}
          showDevSwitcher={nav.showDevSwitcher}
          previewRole={previewRole}
        />
        <div className="ms-auto flex shrink-0 items-center gap-1.5">
          {nav.showDevSwitcher && nav.previewNavItems && DevRoleSwitcher ? (
            <DevRoleSwitcher previewRole={previewRole} onPreviewRoleChange={setPreviewRole} />
          ) : null}
          <UserMenu displayName={resolvedName} />
        </div>
      </div>
    </header>
  );
};
