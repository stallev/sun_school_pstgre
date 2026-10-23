import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { USER_ROLE } from "@sunschool/domain";
import { DynamicsBlock } from "@/components/analytics/DynamicsBlock";
import { PupilPresenceStrip } from "@/components/analytics/PupilPresenceStrip";
import { ParentAchievementsReadOnly } from "@/components/parent/ParentAchievementsReadOnly";
import { ParentChildBricksCard } from "@/components/parent/ParentChildBricksCard";
import { ParentChildSwitcher } from "@/components/parent/ParentChildSwitcher.client";
import { ParentMessagesProvider } from "@/components/parent/ParentMessagesProvider.client";
import { ParentWeeklyDigestCard } from "@/components/parent/ParentWeeklyDigestCard";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ForbiddenState } from "@/components/patterns/ForbiddenState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { ContentText } from "@/components/atoms/ContentText";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { loadParentChildPage } from "@/data/families/load-parent-child-page.server";
import { requireActiveUser } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getSchoolTimezone } from "@/lib/i18n/get-school-timezone.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { pickPupilAnalyticsMessages } from "@/lib/messages/pick-analytics-messages.server";
import { pickParentMessagesFromDictionary } from "@/lib/messages/pick-parent-messages.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { fillMessage } from "@/lib/messages/fill-message";

export type ParentChildPageProps = {
  searchParams: Promise<{ pupilId?: string }>;
};

export const ParentChildPageContent = async ({ searchParams }: ParentChildPageProps) => {
  await connection();
  const context = await requireActiveUser();
  const locale = await getUiLocale();
  const appLocale = messageLocaleToAppLocale(locale);
  const [parentDict, analyticsDict, commonDict] = await Promise.all([
    getDictionary(locale, "parent"),
    getDictionary(locale, "analytics"),
    getDictionary(locale, "common"),
  ]);
  const messages = pickParentMessagesFromDictionary(parentDict);
  const analyticsMessages = pickPupilAnalyticsMessages(analyticsDict);
  const attendanceTemplate = analyticsMessages.attendanceChecked;
  const timeZone = await getSchoolTimezone();

  if (!context.roles.includes(USER_ROLE.PARENT)) {
    return (
      <ForbiddenState
        title={getMessage(commonDict, "errors.forbidden_title")}
        description={getMessage(commonDict, "errors.forbidden")}
        action={
          <CustomLink href="/today">{getMessage(commonDict, "shell.forbidden_home")}</CustomLink>
        }
      />
    );
  }

  const { pupilId: pupilIdParam } = await searchParams;
  const data = await loadParentChildPage(
    await getPrisma(),
    context.userId,
    pupilIdParam ?? null,
    locale,
    timeZone,
    attendanceTemplate,
  );

  if (data.kind === "flag_off" || data.kind === "not_found") notFound();

  if (data.kind === "no_consent") {
    redirect(`/child/consent?pupilId=${data.pupilId}`);
  }

  const emptyConsented = data.kind === "no_children";

  return (
    <ParentMessagesProvider messages={messages}>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-6 lg:max-w-4xl lg:py-8">
        <PageHeader title={messages.child.pageTitle} description={messages.child.pageSubtitle} />
        {emptyConsented ? (
          <EmptyState
            title={messages.child.emptyTitle}
            description={messages.child.emptyDescription}
            action={
              <Button className="min-h-11" render={<CustomLink href="/child/consent" />}>
                {messages.child.consentCta}
              </Button>
            }
          />
        ) : null}
        {data.kind === "page" ? (
          <>
            <ParentChildSwitcher
              childOptions={data.children}
              pupilId={data.pupilId}
              label={messages.child.switchLabel}
              basePath="/child"
            />
            <ParentWeeklyDigestCard digest={data.digest} messages={messages} />
            <ParentChildBricksCard bricks={data.bricks} messages={messages} />
            {data.analyticsView ? (
              <>
                <section>
                  <SectionTitle as="h2" className="mb-2">
                    {messages.child.attendanceTitle}
                  </SectionTitle>
                  <ContentText className="text-sm text-ink-2">
                    {data.analyticsView.attendanceCheckedLabel ??
                      fillMessage(messages.child.attendanceSummary, { present: "—", total: "—" })}
                  </ContentText>
                  <div className="mt-3">
                    <PupilPresenceStrip
                      segments={data.analyticsView.presence}
                      messages={analyticsMessages}
                      locale={appLocale}
                    />
                  </div>
                </section>
                <DynamicsBlock
                  dynamics={data.analyticsView.dynamics}
                  messages={analyticsMessages}
                  locale={appLocale}
                />
              </>
            ) : null}
            <ParentAchievementsReadOnly
              panel={data.achievementPanel}
              achievementsEnabled={data.achievementsEnabled}
              messages={messages}
            />
          </>
        ) : null}
      </div>
    </ParentMessagesProvider>
  );
};
