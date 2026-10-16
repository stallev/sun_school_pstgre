import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ACCOUNT_STATUS } from "@sunschool/domain";
import { ACCESS_DENIED_ROUTE, homeRouteFor } from "@sunschool/policy-edge";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { AuthMessagesProvider } from "@/components/auth/auth-messages-provider.client";
import { AppShell } from "@/components/shell/app-shell";
import { buildShellNav } from "@/data/shell/build-shell-nav.server";
import { loadShellBadgeCounts } from "@/data/shell/load-shell-badge-counts.server";
import { getShellUser } from "@/data/shell/get-shell-user.server";
import { requireSession } from "@/lib/auth/require-user";
import { loadSessionPolicyContext } from "@/lib/auth/load-session-policy.server";
import { getServerEnv } from "@/lib/env.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary } from "@/lib/messages/get-dictionary";
import { pickAuthMessages } from "@/lib/messages/auth-messages";
import { pickShellMessages } from "@/lib/messages/shell-messages";

export const instant = false;

type ProfileLayoutProps = {
  children: ReactNode;
};

const ProfileLayout = async ({ children }: ProfileLayoutProps) => {
  await requireSession();
  const policy = await loadSessionPolicyContext();
  if (!policy) redirect("/login");

  if (policy.status === ACCOUNT_STATUS.DISABLED || policy.status === ACCOUNT_STATUS.DELETED) {
    redirect(ACCESS_DENIED_ROUTE);
  }
  if (policy.status === ACCOUNT_STATUS.REGISTRATION) {
    redirect(homeRouteFor(policy.status, policy.roles));
  }

  const locale = await getUiLocale();
  const [authDictionary, common] = await Promise.all([
    getDictionary(locale, "auth"),
    getDictionary(locale, "common"),
  ]);
  const authMessages = pickAuthMessages(authDictionary);
  const shellMessages = pickShellMessages(common);

  if (policy.status === ACCOUNT_STATUS.ACTIVE) {
    const { APP_ENV } = getServerEnv();
    const [shellUser, nav, badgeCounts] = await Promise.all([
      getShellUser(policy.userId),
      buildShellNav(policy, locale, { appEnv: APP_ENV }),
      loadShellBadgeCounts(policy),
    ]);
    const homeHref = homeRouteFor(policy.status, policy.roles);

    return (
      <AuthMessagesProvider messages={authMessages}>
        <AppShell
          shellMessages={shellMessages}
          homeHref={homeHref}
          displayName={shellUser.displayName}
          nav={nav}
          badgeCounts={badgeCounts}
        >
          {children}
        </AppShell>
      </AuthMessagesProvider>
    );
  }

  return (
    <AuthMessagesProvider messages={authMessages}>
      <AuthScreen variant="reading">{children}</AuthScreen>
    </AuthMessagesProvider>
  );
};

export default ProfileLayout;
