import { connection } from "next/server";
import { notFound } from "next/navigation";
import { USER_ROLE } from "@sunschool/domain";
import { RatingPrivacyNote } from "@/components/analytics/RatingPrivacyNote";
import { RatingTable } from "@/components/analytics/RatingTable";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { loadRatingPage } from "@/data/analytics/load-rating-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickAnalyticsMessages } from "@/lib/messages/pick-analytics-messages.server";
import { pickGlossaryUiMessages } from "@/lib/messages/pick-glossary-messages";
import { pickTeacherAchievementsMessages } from "@/lib/messages/pick-teacher-achievements-messages.server";
import { pickTeacherLessonScreensMessages } from "@/lib/messages/pick-teacher-lesson-screens-messages.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { SegmentedControlLinks } from "@/components/ui/segmented-control-links";
import { ContentText } from "@/components/atoms";

export type RatingPageProps = {
  searchParams: Promise<{ gradeId?: string; scope?: string }>;
};

export const RatingPageContent = async ({ searchParams }: RatingPageProps) => {
  await connection();
  const params = await searchParams;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const data = await loadRatingPage(await getPrisma(), actor.userId, params);
  const locale = await getUiLocale();
  const [analyticsDict, teacherDict, commonDict] = await Promise.all([
    getDictionary(locale, "analytics"),
    getDictionary(locale, "teacher"),
    getDictionary(locale, "common"),
  ]);
  const messages = pickAnalyticsMessages(analyticsDict, locale);
  const glossaryUi = pickGlossaryUiMessages(commonDict);
  const lessonMessages = pickTeacherLessonScreensMessages(teacherDict, messageLocaleToAppLocale(locale));
  const achievementMessages = pickTeacherAchievementsMessages(teacherDict);
  const ratingPageTitle =
    actor.roles.includes(USER_ROLE.ADMIN)
      ? messages.rating.pageTitle
      : messages.rating.pageTitleGroup;

  if (data.kind === "not_found") notFound();

  if (data.kind === "no_active_year") {
    return (
      <div className="space-y-6">
        <PageHeader title={ratingPageTitle} />
        <EmptyState
          title={getMessage(teacherDict, "lesson.no_year_title")}
          description={getMessage(teacherDict, "lesson.no_year_description")}
        />
      </div>
    );
  }

  if (data.kind === "unassigned") {
    return (
      <div className="space-y-6">
        <PageHeader title={ratingPageTitle} />
        <EmptyState
          title={lessonMessages.unassignedTitle}
          description={lessonMessages.unassignedDescription}
        />
      </div>
    );
  }

  const scopeBase = `/rating?${data.gradeId ? `gradeId=${data.gradeId}&` : ""}`;

  return (
    <div className="space-y-6">
      <PageHeader title={ratingPageTitle} description={messages.rating.pageDescription} />
      <RatingPrivacyNote
        badgeLabel={getMessage(commonDict, "shell.nav.desc.rating")}
        hint={messages.rating.privacyNote}
        termHintAriaLabel={glossaryUi.termHintAriaLabel}
      />
      {data.isAdmin ? (
        <SegmentedControlLinks
          aria-label={messages.rating.pageTitle}
          value={data.scope}
          options={[
            {
              value: "group",
              label: messages.rating.scopeGroup,
              href: `${scopeBase}scope=group`,
            },
            {
              value: "school",
              label: messages.rating.scopeSchool,
              href: `${scopeBase}scope=school`,
            },
          ]}
        />
      ) : null}
      {data.isAdmin && data.scope === "group" && data.grades.length > 1 ? (
        <SegmentedControlLinks
          aria-label={lessonMessages.gradeFilterLabel}
          value={data.gradeId ?? ""}
          options={data.grades.map((grade) => ({
            value: grade.gradeId,
            label: grade.name,
            href: `/rating?gradeId=${grade.gradeId}&scope=group`,
          }))}
        />
      ) : null}
      <RatingTable
        rows={data.rows}
        messages={messages.rating}
        showGroupColumn={data.scope === "school"}
        metricGlossary={glossaryUi.lesson_points}
        termHintAriaLabel={glossaryUi.termHintAriaLabel}
        achievementsUiEnabled={data.achievementsUiEnabled}
        achievementMessages={achievementMessages}
      />
      <ContentText className="text-sm text-muted">
        {data.achievementsUiEnabled
          ? achievementMessages.ratingFootnoteAchievements
          : messages.rating.footnote}
      </ContentText>
    </div>
  );
};

