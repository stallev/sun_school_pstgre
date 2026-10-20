import { notFound } from "next/navigation";
import { LockIcon } from "lucide-react";
import { USER_ROLE } from "@sunschool/domain";
import { RatingTable } from "@/components/analytics/RatingTable";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { ContentText } from "@/components/atoms/ContentText";
import { LessonsGradeFilter } from "@/components/teacher/LessonsGradeFilter";
import { loadRatingPage } from "@/data/analytics/load-rating-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { fillMessage } from "@/lib/messages/fill-message";
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

  if (data.kind === "not_found") notFound();

  if (data.kind === "no_active_year") {
    return (
      <div className="space-y-6">
        <PageHeader title={messages.rating.pageTitle} />
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
        <PageHeader title={messages.rating.pageTitle} />
        <EmptyState
          title={lessonMessages.unassignedTitle}
          description={lessonMessages.unassignedDescription}
        />
      </div>
    );
  }

  const subtitle =
    data.scope === "school" && data.isAdmin
      ? fillMessage(messages.rating.pageSubtitleSchool, { year: data.yearName })
      : fillMessage(messages.rating.pageSubtitleGroup, {
          group: data.gradeName,
          year: data.yearName,
        });

  const scopeBase = `/rating?${data.gradeId ? `gradeId=${data.gradeId}&` : ""}`;

  return (
    <div className="space-y-6">
      <PageHeader title={messages.rating.pageTitle} description={subtitle} />
      <p className="flex max-w-3xl items-start gap-2 text-sm text-ink-2">
        <LockIcon className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
        {messages.rating.privacyNote}
      </p>
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
        <LessonsGradeFilter
          grades={data.grades}
          gradeId={data.gradeId}
          messages={lessonMessages}
          actionPath="/rating"
        />
      ) : null}
      <RatingTable rows={data.rows} messages={messages.rating} />
      <ContentText className="text-sm text-muted-foreground">{messages.rating.footnote}</ContentText>
    </div>
  );
};

export default RatingPage;
