import type { ReactNode } from "react";
import { homeRouteFor } from "@sunschool/policy-edge";

/** Product shell reads the session on every request — Block per ADR-002 (auth + nav). */
export const instant = false;
import { AppShell } from "@/components/shell/app-shell";
import { ShellBanners } from "@/components/shell/ShellBanners";
import { buildShellNav } from "@/data/shell/build-shell-nav.server";
import { loadShellBadgeCounts } from "@/data/shell/load-shell-badge-counts.server";
import { loadShellBanners, type ShellBannerCopy } from "@/data/shell/load-shell-banners.server";
import { getShellUser } from "@/data/shell/get-shell-user.server";
import { requireActiveUser } from "@/lib/auth/require-user";
import { getServerEnv } from "@/lib/env.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickShellMessages } from "@/lib/messages/shell-messages";

type AppGroupLayoutProps = {
  children: ReactNode;
};

const AppGroupLayout = async ({ children }: AppGroupLayoutProps) => {
  const context = await requireActiveUser();
  const locale = await getUiLocale();
  const { APP_ENV } = getServerEnv();

  const [shellUser, nav, badgeCounts, common] = await Promise.all([
    getShellUser(context.userId),
    buildShellNav(context, locale, { appEnv: APP_ENV }),
    loadShellBadgeCounts(context),
    getDictionary(locale, "common"),
  ]);

  const shellMessages = pickShellMessages(common);
  const homeHref = homeRouteFor(context.status, context.roles);
  const bannerCopy: ShellBannerCopy = {
    noActiveYearTitle: getMessage(common, "states.no_active_year_title"),
    noActiveYearDescriptionAdmin: getMessage(common, "states.no_active_year_admin"),
    noActiveYearDescriptionTeacher: getMessage(common, "states.no_active_year_teacher"),
    createYearAction: getMessage(common, "states.create_year_action"),
    timezoneUnsetTitle: getMessage(common, "states.timezone_unset_title"),
    timezoneUnsetDescription: getMessage(common, "states.timezone_unset_description"),
    chooseTimezoneAction: getMessage(common, "states.choose_timezone_action"),
  };
  const shellBanners = await loadShellBanners(context, bannerCopy);

  return (
    <AppShell
      shellMessages={shellMessages}
      homeHref={homeHref}
      displayName={shellUser.displayName}
      nav={nav}
      badgeCounts={badgeCounts}
    >
      <ShellBanners banners={shellBanners} />
      {children}
    </AppShell>
  );
};

export default AppGroupLayout;
