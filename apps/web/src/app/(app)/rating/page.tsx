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
import { pickTeacherLessonScreensMessages } from "@/lib/messages/pick-teacher-lesson-screens-messages.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { CustomLink } from "@/components/ui/custom-link";
import { cn } from "@/lib/utils";

type RatingPageProps = {
  searchParams: Promise<{ gradeId?: string; scope?: string }>;
};

const RatingPage = async ({ searchParams }: RatingPageProps) => {
  const params = await searchParams;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const data = await loadRatingPage(await getPrisma(), actor.userId, params);
  const locale = await getUiLocale();
  const analyticsDict = await getDictionary(locale, "analytics");
  const teacherDict = await getDictionary(locale, "teacher");
  const messages = pickAnalyticsMessages(analyticsDict);
  const lessonMessages = pickTeacherLessonScreensMessages(teacherDict, messageLocaleToAppLocale(locale));
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
        <div className="flex flex-wrap gap-2">
          <CustomLink
            href={`${scopeBase}scope=group`}
            className={cn(
              "inline-flex h-11 items-center rounded-lg border px-3 text-sm",
              data.scope === "group" ? "border-line-strong bg-surface font-medium" : "border-line",
            )}
          >
            {messages.rating.scopeGroup}
          </CustomLink>
          <CustomLink
            href={`${scopeBase}scope=school`}
            className={cn(
              "inline-flex h-11 items-center rounded-lg border px-3 text-sm",
              data.scope === "school" ? "border-line-strong bg-surface font-medium" : "border-line",
            )}
          >
            {messages.rating.scopeSchool}
          </CustomLink>
        </div>
      ) : null}
      {data.isAdmin && data.scope === "group" && data.grades.length > 1 ? (
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-label={lessonMessages.gradeFilterLabel}
        >
          {data.grades.map((grade) => (
            <CustomLink
              key={grade.gradeId}
              href={`/rating?gradeId=${grade.gradeId}&scope=group`}
              role="radio"
              aria-checked={grade.gradeId === data.gradeId}
              className={cn(
                "inline-flex h-11 items-center rounded-lg border px-3 text-sm",
                grade.gradeId === data.gradeId
                  ? "border-line-strong bg-surface font-medium"
                  : "border-line",
              )}
            >
              {grade.name}
            </CustomLink>
          ))}
        </div>
      ) : null}
      <RatingTable rows={data.rows} messages={messages.rating} />
      <ContentText className="text-sm text-muted">{messages.rating.footnote}</ContentText>
    </div>
  );
};

export default RatingPage;
