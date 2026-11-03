import type { ReactNode } from "react";
import { ShellHeader } from "@/components/shell/shell-header.client";
import { ShellMessagesProvider } from "@/components/shell/shell-messages-provider.client";
import { ShellRouteAnnouncer } from "@/components/shell/shell-route-announcer.client";
import { SkipToMainLink } from "@/components/shell/skip-to-main-link";
import type { ShellNavPayload } from "@/data/shell/build-shell-nav.server";
import type { ShellMessages } from "@/lib/messages/shell-messages";
import type { NavBadgeCounts } from "@/components/shell/shell-nav-types";
import { shellViewContainerClassName } from "@/lib/shell/shell-layout-classes";

type AppShellProps = {
  shellMessages: ShellMessages;
  homeHref: string;
  displayName: string;
  nav: ShellNavPayload;
  badgeCounts: NavBadgeCounts;
  sidebarCollapsed: boolean;
  children: ReactNode;
};

export const AppShell = ({
  shellMessages,
  homeHref,
  displayName,
  nav,
  badgeCounts,
  sidebarCollapsed,
  children,
}: AppShellProps) => (
  <ShellMessagesProvider messages={shellMessages}>
    <SkipToMainLink label={shellMessages.skipToContent} />
    <ShellHeader
      homeHref={homeHref}
      displayName={displayName}
      nav={nav}
      badgeCounts={badgeCounts}
      initialSidebarCollapsed={sidebarCollapsed}
    >
      <main
        id="main"
        tabIndex={-1}
        className="min-w-0 pb-28 pt-2 outline-none lg:pb-16 lg:pt-3"
      >
        <div id="view" className={shellViewContainerClassName}>
          {children}
        </div>
      </main>
    </ShellHeader>
    <ShellRouteAnnouncer />
  </ShellMessagesProvider>
);
