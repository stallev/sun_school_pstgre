import { connection } from "next/server";
import { notFound } from "next/navigation";
import { LockIcon } from "lucide-react";
import { USER_ROLE } from "@sunschool/domain";
import { RatingTable } from "@/components/analytics/RatingTable";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { ContentText } from "@/components/atoms";
import { loadRatingPage } from "@/data/analytics/load-rating-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickAnalyticsMessages } from "@/lib/messages/pick-analytics-messages.server";
import { pickTeacherAchievementsMessages } from "@/lib/messages/pick-teacher-achievements-messages.server";
import { pickTeacherLessonScreensMessages } from "@/lib/messages/pick-teacher-lesson-screens-messages.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { SegmentedControlLinks } from "@/components/ui/segmented-control-links";

export type RatingPageProps = {
  searchParams: Promise<{ gradeId?: string; scope?: string }>;
};

export const RatingPageContent = async ({ searchParams }: RatingPageProps) => {
  await connection();
  const params = await searchParams;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const data = await loadRatingPage(await getPrisma(), actor.userId, params);
  const locale = await getUiLocale();
  const analyticsDict = await getDictionary(locale, "analytics");
  const teacherDict = await getDictionary(locale, "teacher");
  const messages = pickAnalyticsMessages(analyticsDict);
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
      <div className="flex max-w-3xl items-start gap-2">
        <LockIcon className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
        <ContentText className="text-sm text-ink-2">{messages.rating.privacyNote}</ContentText>
      </div>
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

