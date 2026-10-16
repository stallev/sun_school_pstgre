"use client";

import { CustomLink } from "@/components/ui/custom-link";
import { ShellNavigation } from "@/components/shell/shell-navigation.client";
import { UserMenu } from "@/components/shell/user-menu";
import type { NavBadgeCounts } from "@/components/shell/shell-nav-types";
import { useShellMessages } from "@/components/shell/shell-messages-provider.client";
import type { ShellNavPayload } from "@/data/shell/build-shell-nav.server";

type ShellHeaderProps = {
  homeHref: string;
  displayName: string;
  nav: ShellNavPayload;
  badgeCounts: NavBadgeCounts;
};

export const ShellHeader = ({ homeHref, displayName, nav, badgeCounts }: ShellHeaderProps) => {
  const messages = useShellMessages();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-sm reduce-transparency:bg-surface">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-2 px-4 sm:px-6 lg:px-8">
        <CustomLink href={homeHref} className="shrink-0 font-display text-lg font-medium text-ink no-underline">
          {messages.brand}
        </CustomLink>
        <ShellNavigation
          shellRole={nav.shellRole}
          navItems={nav.navItems}
          previewNavItems={nav.previewNavItems}
          badgeCounts={badgeCounts}
          showDevSwitcher={nav.showDevSwitcher}
        />
        <div className="ms-auto shrink-0">
          <UserMenu displayName={displayName || messages.displayNameFallback} />
        </div>
      </div>
    </header>
  );
};
