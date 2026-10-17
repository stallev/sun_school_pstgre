import { USER_ROLE } from "@sunschool/domain";
import { Banner } from "@/components/patterns/Banner";
import { PageHeader } from "@/components/patterns/PageHeader";
import { NumberDisplay } from "@/components/atoms/NumberDisplay";
import { SectionTitle } from "@/components/atoms";
import { ContentText } from "@/components/atoms/ContentText";
import { CustomLink } from "@/components/ui/custom-link";
import { loadSchoolDashboardCounts } from "@/data/school/load-school-dashboard.server";
import { loadShellBanners, type ShellBannerCopy } from "@/data/shell/load-shell-banners.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickAdminMessages } from "@/lib/messages/pick-admin-messages.server";

const SchoolPage = async () => {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const prisma = await getPrisma();
  const locale = await getUiLocale();
  const [adminDict, commonDict, counts] = await Promise.all([
    getDictionary(locale, "admin"),
    getDictionary(locale, "common"),
    loadSchoolDashboardCounts(prisma),
  ]);
  const adminMessages = pickAdminMessages(adminDict);
  const bannerCopy: ShellBannerCopy = {
    noActiveYearTitle: getMessage(commonDict, "states.no_active_year_title"),
    noActiveYearDescriptionAdmin: getMessage(commonDict, "states.no_active_year_admin"),
    noActiveYearDescriptionTeacher: getMessage(commonDict, "states.no_active_year_teacher"),
    createYearAction: getMessage(commonDict, "states.create_year_action"),
    timezoneUnsetTitle: getMessage(commonDict, "states.timezone_unset_title"),
    timezoneUnsetDescription: getMessage(commonDict, "states.timezone_unset_description"),
    chooseTimezoneAction: getMessage(commonDict, "states.choose_timezone_action"),
  };
  const banners = await loadShellBanners(actor, bannerCopy);

  const statCards = [
    { label: adminMessages.school.groupsLabel, value: counts.groupCount, href: "/groups" },
    { label: adminMessages.school.pupilsLabel, value: counts.pupilCount, href: "/people" },
    { label: adminMessages.school.requestsLabel, value: counts.pendingRequests, href: "/approvals" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={adminMessages.page.schoolTitle} description={adminMessages.school.pageSubtitle} />
      {banners.length > 0 ? (
        <div className="space-y-3">
          {banners.map((item, index) => (
            <Banner key={`${item.title}-${index}`} tone="warning" title={item.title}>
              <p>{item.description}</p>
              {item.actionHref && item.actionLabel ? (
                <CustomLink href={item.actionHref} className="mt-2 inline-block text-cobalt-ink underline">
                  {item.actionLabel}
                </CustomLink>
              ) : null}
            </Banner>
          ))}
        </div>
      ) : null}
      <section>
        <SectionTitle>{adminMessages.school.statsTitle}</SectionTitle>
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {statCards.map((card) => (
            <li key={card.href} className="h-full">
              <CustomLink
                href={card.href}
                className="flex h-full flex-col rounded-xl border border-line bg-surface p-4 hover:bg-paper"
              >
                <ContentText tone="secondary" className="text-sm">
                  {card.label}
                </ContentText>
                <NumberDisplay className="mt-2 text-3xl">{card.value}</NumberDisplay>
              </CustomLink>
            </li>
          ))}
        </ul>
      </section>
      <ContentText tone="secondary" className="text-sm">
        {adminMessages.school.scaffoldNote}
      </ContentText>
    </div>
  );
};

export default SchoolPage;
