"use client";

import { USER_ROLE, type UserRole } from "@sunschool/domain";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { BrandMark } from "@/components/patterns/BrandMark";
import { CustomLink } from "@/components/ui/custom-link";
import { NavDrawer } from "@/components/shell/nav-drawer";
import { ShellSidebarToggle } from "@/components/shell/shell-sidebar-toggle.client";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { UserMenu } from "@/components/shell/user-menu";
import { ViewAsBadge } from "@/components/shell/ViewAsBadge";
import type { NavBadgeCounts } from "@/components/shell/shell-nav-types";
import { useShellMessages } from "@/components/shell/shell-messages-provider.client";
import type { ShellNavPayload } from "@/data/shell/build-shell-nav.server";
import { resolveActiveGroupKey, resolveActiveNavKey } from "@/lib/shell/nav-resolver";
import {
  shellGridClassName,
  shellRailDataAttribute,
} from "@/lib/shell/shell-layout-classes";
import { resolveShellScreenTitle } from "@/lib/shell/shell-screen-title";
import type { SidebarPreference } from "@/lib/shell/sidebar-collapsed-cookie";
import { cn } from "@/lib/utils";

const SIDEBAR_NAV_ID = "sidebar";
const XL_MEDIA_QUERY = "(min-width: 1280px)";

const subscribeToXl = (onChange: () => void) => {
  const query = window.matchMedia(XL_MEDIA_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const getIsXl = () => window.matchMedia(XL_MEDIA_QUERY).matches;
const getIsXlOnServer = () => false;

type ShellHeaderProps = {
  homeHref: string;
  displayName: string;
  nav: ShellNavPayload;
  badgeCounts: NavBadgeCounts;
  initialSidebarPreference: SidebarPreference;
  children: ReactNode;
};

const formatViewModeLabel = (
  template: string,
  viewAsRole: UserRole,
  roleNameAdmin: string,
  roleNameTeacher: string,
): string => {
  const roleName = viewAsRole === USER_ROLE.ADMIN ? roleNameAdmin : roleNameTeacher;
  return template.replace("{role}", roleName);
};

export const ShellHeader = ({
  homeHref,
  displayName,
  nav,
  badgeCounts,
  initialSidebarPreference,
  children,
}: ShellHeaderProps) => {
  const messages = useShellMessages();
  const pathname = usePathname();
  const router = useRouter();

  const screenTitle =
    resolveShellScreenTitle(pathname, messages.screenTitles) ?? messages.brand;
  const roleName =
    nav.shellRole === USER_ROLE.ADMIN ? messages.roleNameAdmin : messages.roleNameTeacher;
  const resolvedName = displayName || messages.displayNameFallback;
  const [sidebarPreference, setSidebarPreference] = useState(initialSidebarPreference);
  const isXl = useSyncExternalStore(subscribeToXl, getIsXl, getIsXlOnServer);
  const isAutoRail = sidebarPreference === "auto";
  // Real state for the toggle only; layout classes come from the preference, never from the width.
  const sidebarCollapsed = isAutoRail ? !isXl : sidebarPreference === "collapsed";
  const showViewAsBadge = nav.viewAsRole !== nav.shellRole;
  const viewModeLabel = showViewAsBadge
    ? formatViewModeLabel(
        messages.viewModeTemplate,
        nav.viewAsRole,
        messages.roleNameAdmin,
        messages.roleNameTeacher,
      )
    : "";

  const displayItems = useMemo(() => {
    if (nav.viewAsRole !== nav.shellRole && nav.previewNavItems) return nav.previewNavItems;
    return nav.navItems;
  }, [nav.navItems, nav.previewNavItems, nav.shellRole, nav.viewAsRole]);

  const activeKey = resolveActiveNavKey(pathname, nav.viewAsRole);
  const activeGroupKey = resolveActiveGroupKey(displayItems, activeKey);

  const handlePreviewRoleChange = (_role: UserRole) => {
    router.refresh();
  };

  const navProps = {
    items: displayItems,
    pathname,
    activeKey,
    activeGroupKey,
    badgeCounts,
    emptyHint: nav.previewNavEmptyHint,
  };

  return (
    <div
      className="group/shell flex min-h-dvh flex-col"
      data-rail={shellRailDataAttribute(sidebarPreference)}
    >
      <header className="sticky top-0 z-40 overflow-visible border-b border-line bg-surface/90 backdrop-blur-md reduce-transparency:bg-surface reduce-transparency:backdrop-blur-none">
        <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center gap-chip px-page lg:gap-0 lg:px-0">
          <NavDrawer
            {...navProps}
            displayName={resolvedName}
            roleName={roleName}
          />
          <div
            className={cn(
              "flex min-w-0 items-center gap-2.5 lg:h-full lg:shrink-0 lg:border-r lg:border-line lg:px-5",
              sidebarPreference === "expanded" && "lg:w-64",
              sidebarPreference === "collapsed" && "lg:w-16 lg:justify-center lg:px-0",
              isAutoRail && "lg:w-16 lg:justify-center lg:px-0 xl:w-64 xl:justify-start xl:px-5",
            )}
          >
            <CustomLink
              href={homeHref}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2.5 no-underline lg:flex-none",
                sidebarPreference === "collapsed" && "lg:justify-center",
                isAutoRail && "lg:justify-center xl:justify-start",
              )}
            >
              <span className="min-w-0 lg:hidden">
                <span className="block truncate font-display text-lg font-medium leading-tight text-ink">
                  {screenTitle}
                </span>
                <span className="block truncate text-sm text-muted">
                  {resolvedName} · {roleName}
                </span>
              </span>
              {isAutoRail ? (
                <>
                  <span className="hidden lg:inline-flex xl:hidden">
                    <BrandMark />
                  </span>
                  <span className="hidden xl:inline-flex">
                    <BrandMark brandName={messages.brand} />
                  </span>
                </>
              ) : (
                <span className="hidden lg:inline-flex">
                  <BrandMark brandName={sidebarCollapsed ? undefined : messages.brand} />
                </span>
              )}
            </CustomLink>
          </div>
          <ShellSidebarToggle
            sidebarCollapsed={sidebarCollapsed}
            onSidebarCollapsedChange={(collapsed) =>
              setSidebarPreference(collapsed ? "collapsed" : "expanded")
            }
            controlsId={SIDEBAR_NAV_ID}
          />
          <div className="ms-auto flex min-w-0 flex-1 items-center justify-end gap-chip lg:px-page">
            {showViewAsBadge ? <ViewAsBadge label={viewModeLabel} /> : null}
            <UserMenu
              displayName={resolvedName}
              roleSubtitle={roleName}
              showDevSwitcher={nav.showDevSwitcher}
              shellRole={nav.shellRole}
              previewRole={nav.viewAsRole}
              onPreviewRoleChange={handlePreviewRoleChange}
            />
          </div>
        </div>
      </header>
      <div className={shellGridClassName(sidebarPreference)}>
        <SidebarNav
          id={SIDEBAR_NAV_ID}
          items={displayItems}
          activeKey={activeKey}
          badgeCounts={badgeCounts}
          rail={sidebarPreference}
          emptyHint={nav.previewNavEmptyHint}
        />
        {children}
      </div>
    </div>
  );
};
