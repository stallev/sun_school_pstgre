import { USER_ROLE } from "@sunschool/domain";
import { ContentText, SectionTitle } from "@/components/atoms";
import { AlertText } from "@/components/atoms/AlertText";
import { LessonsGradeFilter } from "@/components/teacher/LessonsGradeFilter";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { CustomLink } from "@/components/ui/custom-link";
import { loadVersesCatalogPage } from "@/data/lessons/load-verses-catalog-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickTeacherLessonScreensMessages } from "@/lib/messages/pick-teacher-lesson-screens-messages.server";

type VersesPageProps = {
  searchParams: Promise<{ gradeId?: string }>;
};

const VersesPage = async ({ searchParams }: VersesPageProps) => {
  const params = await searchParams;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const locale = await getUiLocale();
  const appLocale = messageLocaleToAppLocale(locale);
  const data = await loadVersesCatalogPage(
    await getPrisma(),
    actor.userId,
    params.gradeId ?? null,
    appLocale,
  );
  const teacherDict = await getDictionary(locale, "teacher");
  const messages = pickTeacherLessonScreensMessages(teacherDict, appLocale);

  if (data.kind === "no_active_year") {
    return (
      <div className="space-y-6">
        <PageHeader title={messages.versesPageTitle} />
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
        <PageHeader title={messages.versesPageTitle} />
        <EmptyState title={messages.unassignedTitle} description={messages.unassignedDescription} />
      </div>
    );
  }

  const gradeOptions = data.grades.map((g) => ({ gradeId: g.gradeId, name: g.name }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={messages.versesPageTitle}
        description={messages.versesPageSubtitle(data.gradeName, data.yearName)}
      />
      {data.grades.length > 1 ? (
        <LessonsGradeFilter
          grades={gradeOptions}
          gradeId={data.gradeId}
          messages={messages}
          actionPath="/verses"
        />
      ) : null}
      {data.rows.length === 0 ? (
        <EmptyState
          title={messages.emptyVersesTitle}
          description={messages.emptyVersesDescription}
        />
      ) : (
        <ul className="space-y-4">
          {data.rows.map((row) => (
            <li key={row.refLabel} className="space-y-3 rounded-xl border border-line bg-surface p-4">
              <SectionTitle>{row.refLabel}</SectionTitle>
              {row.hasMissing ? (
                <AlertText>{messages.verseMissing}</AlertText>
              ) : (
                <ContentText className="text-sm whitespace-pre-wrap">{row.text}</ContentText>
              )}
              <div className="space-y-1">
                <ContentText className="text-sm font-medium text-ink">{messages.usedInLessons}</ContentText>
                <ul className="space-y-1">
                  {row.usages.map((usage) => (
                    <li key={`${row.refLabel}-${usage.lessonId}`}>
                      <CustomLink
                        href={`/lessons/${usage.lessonId}`}
                        className="text-sm text-cobalt-ink hover:underline"
                      >
                        {messages.lessonUsageLink(usage.ordinal, usage.title)}
                      </CustomLink>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VersesPage;
