"use client";

import { USER_ROLE, type UserRole } from "@sunschool/domain";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { BrandMark } from "@/components/patterns/BrandMark";
import { CustomLink } from "@/components/ui/custom-link";
import { NavDrawer } from "@/components/shell/nav-drawer";
import { SidebarNav } from "@/components/shell/sidebar-nav";
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
  children: ReactNode;
};

export const ShellHeader = ({ homeHref, displayName, nav, badgeCounts, children }: ShellHeaderProps) => {
  const messages = useShellMessages();
  const pathname = usePathname();
  const [previewRole, setPreviewRole] = useState<UserRole>(nav.shellRole);

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

  const navProps = {
    items: displayItems,
    pathname,
    activeKey,
    activeGroupKey,
    badgeCounts,
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 overflow-visible border-b border-line bg-surface/90 backdrop-blur-md reduce-transparency:bg-surface reduce-transparency:backdrop-blur-none">
        <div className="flex h-14 items-center gap-2 px-2 sm:px-4 lg:gap-0 lg:px-0">
          <NavDrawer
            {...navProps}
            displayName={resolvedName}
            roleName={roleName}
          />
          <CustomLink
            href={homeHref}
            className="flex min-w-0 flex-1 items-center gap-2.5 no-underline lg:h-full lg:w-64 lg:shrink-0 lg:border-r lg:border-line lg:px-5 lg:flex-none"
          >
            <span className="min-w-0 lg:hidden">
              <span className="block truncate font-display text-lg font-medium leading-tight text-ink">
                {screenTitle}
              </span>
              <span className="block truncate text-sm text-muted">
                {resolvedName} · {roleName}
              </span>
            </span>
            <span className="hidden lg:inline-flex">
              <BrandMark brandName={messages.brand} />
            </span>
          </CustomLink>
          <div className="ms-auto flex shrink-0 items-center gap-1.5 lg:px-8">
            <UserMenu
              displayName={resolvedName}
              roleSubtitle={roleName}
              showDevSwitcher={nav.showDevSwitcher && Boolean(nav.previewNavItems)}
              shellRole={nav.shellRole}
              previewRole={previewRole}
              onPreviewRoleChange={setPreviewRole}
            />
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        <SidebarNav items={displayItems} activeKey={activeKey} badgeCounts={badgeCounts} />
        {children}
      </div>
    </div>
  );
};
