import { connection } from "next/server";

import { auth } from "@/auth";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher.client";
import { TopBarAuthActions } from "@/components/shell/TopBarAuthActions.client";
import { TopBarNotifications } from "@/components/shell/TopBarNotifications.client";
import { ThemeToggle } from "@/components/shell/ThemeToggle.client";
import { Container } from "@/components/ui/container";
import { PulseLogo } from "@/components/ui/PulseLogo";
import { getMessages } from "@/lib/messages/server";

export async function TopBar() {
  await connection();
  const messages = await getMessages();
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Container
        variant="shell"
        className="flex h-16 items-center gap-3"
      >
        <div className="inline-flex min-h-11 min-w-11 items-center rounded-full px-2">
          <PulseLogo
            href="/"
            className="text-xl"
            homeAriaLabel={messages.site.logoHomeAriaLabel}
          />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <div className="hidden md:block">
            <LocaleSwitcher variant="compact" />
          </div>
          {isAuthenticated ? <TopBarNotifications /> : null}
          <ThemeToggle />
          <TopBarAuthActions
            isAuthenticated={isAuthenticated}
            userName={session?.user?.name}
          />
        </div>
      </Container>
    </header>
  );
}
