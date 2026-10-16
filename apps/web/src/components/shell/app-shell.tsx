import type { ReactNode } from "react";
import { ShellHeader } from "@/components/shell/shell-header.client";
import { ShellMessagesProvider } from "@/components/shell/shell-messages-provider.client";
import { ShellRouteAnnouncer } from "@/components/shell/shell-route-announcer.client";
import { SkipToMainLink } from "@/components/shell/skip-to-main-link";
import type { ShellNavPayload } from "@/data/shell/build-shell-nav.server";
import type { ShellMessages } from "@/lib/messages/shell-messages";
import type { NavBadgeCounts } from "@/components/shell/shell-nav-types";

type AppShellProps = {
  shellMessages: ShellMessages;
  homeHref: string;
  displayName: string;
  nav: ShellNavPayload;
  badgeCounts: NavBadgeCounts;
  children: ReactNode;
};

export const AppShell = ({
  shellMessages,
  homeHref,
  displayName,
  nav,
  badgeCounts,
  children,
}: AppShellProps) => (
  <ShellMessagesProvider messages={shellMessages}>
    <SkipToMainLink label={shellMessages.skipToContent} />
    <ShellHeader homeHref={homeHref} displayName={displayName} nav={nav} badgeCounts={badgeCounts} />
    <main
      id="main"
      tabIndex={-1}
      className="mx-auto w-full max-w-[1400px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-8"
    >
      {children}
    </main>
    <ShellRouteAnnouncer />
  </ShellMessagesProvider>
);
