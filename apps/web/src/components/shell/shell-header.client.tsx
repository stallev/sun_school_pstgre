"use client";

import { USER_ROLE } from "@sunschool/domain";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/patterns/BrandMark";
import { CustomLink } from "@/components/ui/custom-link";
import { ShellNavigation } from "@/components/shell/shell-navigation.client";
import { UserMenu } from "@/components/shell/user-menu";
import type { NavBadgeCounts } from "@/components/shell/shell-nav-types";
import { useShellMessages } from "@/components/shell/shell-messages-provider.client";
import type { ShellNavPayload } from "@/data/shell/build-shell-nav.server";
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
  const screenTitle =
    resolveShellScreenTitle(pathname, messages.screenTitles) ?? messages.brand;
  const roleName =
    nav.shellRole === USER_ROLE.ADMIN ? messages.roleNameAdmin : messages.roleNameTeacher;
  const resolvedName = displayName || messages.displayNameFallback;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-sm reduce-transparency:bg-surface">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-2 px-2 sm:px-4 lg:px-8">
        <CustomLink href={homeHref} className="min-w-0 shrink no-underline lg:shrink-0">
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
          displayName={resolvedName}
        />
        <div className="ms-auto shrink-0">
          <UserMenu displayName={resolvedName} />
        </div>
      </div>
    </header>
  );
};
