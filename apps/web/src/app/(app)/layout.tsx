import type { Metadata } from "next";
import type { ReactNode } from "react";
import { connection } from "next/server";
import { USER_ROLE } from "@sunschool/domain";
import { homeRouteFor } from "@sunschool/policy-edge";

/** Product shell reads the session on every request — Block per ADR-002 (auth + nav). */
export const instant = false;
import { AppShell } from "@/components/shell/app-shell";
import { ConsentDeadlineBanner } from "@/components/shell/ConsentDeadlineBanner";
import { ShellBanners } from "@/components/shell/ShellBanners";
import { loadLegacyConsentDeadlineSummary } from "@/data/school/list-legacy-pending";
import { buildShellNav } from "@/data/shell/build-shell-nav.server";
import { loadShellBadgeCounts } from "@/data/shell/load-shell-badge-counts.server";
import { loadShellBanners, type ShellBannerCopy } from "@/data/shell/load-shell-banners.server";
import { getShellUser } from "@/data/shell/get-shell-user.server";
import { requireActiveUser } from "@/lib/auth/require-user";
import { getServerEnv } from "@/lib/env.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { getPrisma } from "@/lib/db.server";
import { pickShellMessages } from "@/lib/messages/shell-messages";
import {
  readRequestPathname,
  resolveShellRouteDocumentTitle,
} from "@/lib/metadata/product-document-title.server";

export const generateMetadata = async (): Promise<Metadata> => {
  const locale = await getUiLocale();
  const pathname = await readRequestPathname();
  if (!pathname) return {};

  const common = await getDictionary(locale, "common");
  const pageTitle = resolveShellRouteDocumentTitle(pathname, common);
  if (!pageTitle) return {};

  return { title: pageTitle };
};

type AppGroupLayoutProps = {
  children: ReactNode;
};

const fillTemplate = (template: string, values: Record<string, string | number>): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  );

const AppGroupLayout = async ({ children }: AppGroupLayoutProps) => {
  // `new Date()` in this shell (legacy-consent “today”, session expiry) is sync IO.
  // `instant = false` does not allow it during prerender; `connection()` opts the rest into request time.
  await connection();
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

  let legacyConsentBanner: ReactNode = null;
  if (context.roles.includes(USER_ROLE.ADMIN)) {
    const prisma = await getPrisma();
    const legacySummary = await loadLegacyConsentDeadlineSummary(prisma);
    if (legacySummary.pendingCount > 0 && legacySummary.deadlineOn) {
      const title = getMessage(common, "states.legacy_consent_banner_title");
      const description = fillTemplate(
        getMessage(
          common,
          legacySummary.isOverdue
            ? "states.legacy_consent_banner_overdue"
            : "states.legacy_consent_banner_active",
        ),
        {
          count: legacySummary.pendingCount,
          date: legacySummary.deadlineOn,
          days: legacySummary.daysRemaining ?? 0,
        },
      );
      legacyConsentBanner = (
        <ConsentDeadlineBanner
          title={title}
          description={description}
          isOverdue={legacySummary.isOverdue}
        />
      );
    }
  }

  return (
    <AppShell
      shellMessages={shellMessages}
      homeHref={homeHref}
      displayName={shellUser.displayName}
      nav={nav}
      badgeCounts={badgeCounts}
    >
      {legacyConsentBanner}
      <ShellBanners banners={shellBanners} />
      {children}
    </AppShell>
  );
};

export default AppGroupLayout;
