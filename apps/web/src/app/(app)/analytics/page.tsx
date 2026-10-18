import { notFound } from "next/navigation";
import { USER_ROLE } from "@sunschool/domain";
import { AnalyticsKpiRow } from "@/components/analytics/AnalyticsKpiRow";
import { AnalyticsPeriodFilter } from "@/components/analytics/AnalyticsPeriodFilter";
import { ChartTableToggle } from "@/components/analytics/ChartTableToggle";
import { ConductedLessonsTable } from "@/components/analytics/ConductedLessonsTable";
import { DataQualityNote } from "@/components/analytics/DataQualityNote";
import { GroupAnalyticsTables } from "@/components/analytics/GroupAnalyticsTables";
import { MethodologyNote } from "@/components/analytics/MethodologyNote";
import { SampleCompositionRow } from "@/components/analytics/SampleCompositionRow";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { LessonsGradeFilter } from "@/components/teacher/LessonsGradeFilter";
import { loadAnalyticsPage } from "@/data/analytics/load-analytics-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickAnalyticsMessages } from "@/lib/messages/pick-analytics-messages.server";
import { pickTeacherLessonScreensMessages } from "@/lib/messages/pick-teacher-lesson-screens-messages.server";

type AnalyticsPageProps = {
  searchParams: Promise<{
    gradeId?: string;
    mode?: string;
    month?: string;
    from?: string;
    to?: string;
  }>;
};

const AnalyticsPage = async ({ searchParams }: AnalyticsPageProps) => {
  const params = await searchParams;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const data = await loadAnalyticsPage(await getPrisma(), actor.userId, params);
  const locale = await getUiLocale();
  const appLocale = messageLocaleToAppLocale(locale);
  const analyticsDict = await getDictionary(locale, "analytics");
  const teacherDict = await getDictionary(locale, "teacher");
  const messages = pickAnalyticsMessages(analyticsDict);
  const lessonMessages = pickTeacherLessonScreensMessages(teacherDict, appLocale);
  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(appLocale, { day: "numeric", month: "short" }).format(new Date(`${iso}T12:00:00Z`));

  if (data.kind === "not_found") notFound();

  if (data.kind === "no_active_year") {
    return (
      <div className="space-y-6">
        <PageHeader title={messages.pageTitle} />
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
        <PageHeader title={messages.pageTitle} />
        <EmptyState title={lessonMessages.unassignedTitle} description={lessonMessages.unassignedDescription} />
      </div>
    );
  }

  const { analytics } = data;
  const pupilCount = Object.values(analytics.pupilsByLayer).flat().length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={messages.pageTitle}
        description={messages.pageSubtitle(data.gradeName, data.yearName)}
      />
      {data.isAdmin && data.grades.length > 1 ? (
        <LessonsGradeFilter
          grades={data.grades}
          gradeId={data.gradeId}
          messages={lessonMessages}
          actionPath="/analytics"
          hiddenFields={{ mode: data.periodFilter.mode }}
        />
      ) : null}
      <AnalyticsPeriodFilter gradeId={data.gradeId} periodFilter={data.periodFilter} messages={messages} />
      {data.isAdmin && data.dataQuality && data.dataQuality.missingPupilRecordsOnCheckedLessons > 0 ? (
        <DataQualityNote
          missingRecords={data.dataQuality.missingPupilRecordsOnCheckedLessons}
          messages={messages}
        />
      ) : null}
      {pupilCount === 0 ? (
        <EmptyState
          title={messages.tables.emptyPupilsTitle}
          description={messages.tables.emptyPupilsDescription}
        />
      ) : !analytics.hasCheckedLessonsInPeriod ? (
        <EmptyState
          title={messages.tables.noCheckedLessonsTitle}
          description={messages.tables.noCheckedLessonsDescription}
        />
      ) : (
        <>
          <AnalyticsKpiRow snapshot={analytics} messages={messages} />
          <SampleCompositionRow snapshot={analytics} messages={messages} />
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartTableToggle
              chartId="attendance"
              title={messages.charts.attendanceTitle}
              methodology={messages.charts.methodologyAttendance}
              points={analytics.charts.attendance}
              messages={messages.charts}
              formatDate={formatDate}
              formatValue={(point) =>
                point.value === null
                  ? messages.kpiEmpty
                  : messages.formatPercent(Number(point.value.toFixed(1)))}
              yDomain={[0, 100]}
            />
            <ChartTableToggle
              chartId="verses"
              title={messages.charts.versesTitle}
              methodology={messages.charts.methodologyVerses}
              points={analytics.charts.verses}
              messages={messages.charts}
              formatDate={formatDate}
              formatValue={messages.formatChartValue}
            />
            <ChartTableToggle
              chartId="test"
              title={messages.charts.testTitle}
              methodology={messages.charts.methodologyTest}
              points={analytics.charts.test}
              messages={messages.charts}
              formatDate={formatDate}
              formatValue={messages.formatChartValue}
              yDomain={[0, 10]}
            />
            <ChartTableToggle
              chartId="notebook"
              title={messages.charts.notebookTitle}
              methodology={messages.charts.methodologyNotebook}
              points={analytics.charts.notebook}
              messages={messages.charts}
              formatDate={formatDate}
              formatValue={messages.formatChartValue}
              yDomain={[0, 10]}
            />
          </div>
          <GroupAnalyticsTables snapshot={analytics} messages={messages} />
          <ConductedLessonsTable snapshot={data.conducted} messages={messages} />
          <MethodologyNote messages={messages} />
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
