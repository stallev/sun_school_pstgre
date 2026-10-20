import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ACADEMIC_YEAR_STATUS, ANALYTICS_METHODOLOGY_VERSION, USER_ROLE } from "@sunschool/domain";
import { AnalyticsPeriodFilter } from "@/components/analytics/AnalyticsPeriodFilter";
import { ChartTableToggle } from "@/components/analytics/ChartTableToggle";
import { ConductedLessonsTable } from "@/components/analytics/ConductedLessonsTable";
import { DataQualityNote } from "@/components/analytics/DataQualityNote";
import { DeletedDataNote } from "@/components/analytics/DeletedDataNote";
import { GroupAnalyticsTables } from "@/components/analytics/GroupAnalyticsTables";
import { MethodologyNote } from "@/components/analytics/MethodologyNote";
import { SampleCompositionRow } from "@/components/analytics/SampleCompositionRow";
import { buildGroupYearTableRows } from "@/components/analytics/years/build-group-year-table-rows";
import { GroupAnalyticsYearNav } from "@/components/analytics/years/GroupAnalyticsYearNav.client";
import { KpiTiles } from "@/components/analytics/years/KpiTiles";
import { MethodologyVersionNote } from "@/components/analytics/years/MethodologyVersionNote";
import { ReadOnlyYearNote } from "@/components/analytics/years/ReadOnlyYearNote";
import { AnalyticsRetryButton } from "@/components/analytics/AnalyticsRetryButton.client";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ErrorState } from "@/components/patterns/ErrorState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { LessonsGradeFilter } from "@/components/teacher/LessonsGradeFilter";
import { Skeleton } from "@/components/ui/skeleton";
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
    year?: string;
    mode?: string;
    month?: string;
    from?: string;
    to?: string;
  }>;
};

const YearNavFallback = () => (
  <div className="mb-6 space-y-4" aria-busy="true">
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-11 w-28 rounded-lg" />
      ))}
    </div>
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
);

const AnalyticsPage = async ({ searchParams }: AnalyticsPageProps) => {
  const params = await searchParams;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const data = await loadAnalyticsPage(await getPrisma(), actor.userId, params);
  const locale = await getUiLocale();
  const appLocale = messageLocaleToAppLocale(locale);
  const analyticsDict = await getDictionary(locale, "analytics");
  const commonDict = await getDictionary(locale, "common");
  const teacherDict = await getDictionary(locale, "teacher");
  const messages = pickAnalyticsMessages(analyticsDict);
  const lessonMessages = pickTeacherLessonScreensMessages(teacherDict, appLocale);
  const yearMessages = messages.years;
  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(appLocale, { day: "numeric", month: "short" }).format(new Date(`${iso}T12:00:00Z`));

  if (data.kind === "not_found") notFound();

  if (data.kind === "no_active_year") {
    return (
      <div className="space-y-6">
        <PageHeader title={messages.pageTitle} />
        <EmptyState
          title={getMessage(teacherDict, "lesson.no_year_title")}
          description={getMessage(analyticsDict, "years.none")}
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

  const { analytics, selectedSnapshotMissing } = data;
  const pupilCount = Object.values(analytics.pupilsByLayer).flat().length;
  const retryLabel = getMessage(commonDict, "states.error_retry");
  const tableRows = buildGroupYearTableRows(data.yearTotals.rows);
  const selectedTableRow = tableRows.find((row) => row.yearId === data.yearId);
  const selectedYearRow = data.yearTotals.rows.find((row) => row.yearId === data.yearId);
  const isActiveYear = selectedYearRow?.status === ACADEMIC_YEAR_STATUS.ACTIVE;
  const showStaleMethodology =
    selectedYearRow &&
    selectedYearRow.methodologyVersion !== ANALYTICS_METHODOLOGY_VERSION;
  const periodHiddenFields = { year: data.yearId };
  const gradeHiddenFields = { mode: data.periodFilter.mode, year: data.yearId };

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
          hiddenFields={gradeHiddenFields}
        />
      ) : null}
      <Suspense fallback={<YearNavFallback />}>
        <GroupAnalyticsYearNav
          groupLabel={data.gradeName}
          tableRows={tableRows}
          selectedYearId={data.yearId}
          messages={messages}
        />
      </Suspense>
      {!isActiveYear ? <ReadOnlyYearNote messages={yearMessages} /> : null}
      {showStaleMethodology ? (
        <MethodologyVersionNote
          snapshotVersion={selectedYearRow.methodologyVersion}
          currentVersion={ANALYTICS_METHODOLOGY_VERSION}
          messages={yearMessages}
        />
      ) : null}
      {selectedSnapshotMissing ? (
        <ErrorState
          title={yearMessages.snapshotMissing}
          action={<AnalyticsRetryButton retryLabel={retryLabel} />}
        />
      ) : (
        <>
          <AnalyticsPeriodFilter
            gradeId={data.gradeId}
            periodFilter={data.periodFilter}
            messages={messages}
            hiddenFields={periodHiddenFields}
          />
          {isActiveYear && data.isAdmin && data.dataQuality && data.dataQuality.missingPupilRecordsOnCheckedLessons > 0 ? (
            <DataQualityNote
              missingRecords={data.dataQuality.missingPupilRecordsOnCheckedLessons}
              messages={messages}
            />
          ) : null}
          {isActiveYear &&
          data.isAdmin &&
          data.deletedDataInPeriod &&
          data.deletedDataInPeriod.latestResolvedAtIso ? (
            <DeletedDataNote
              deletedChildCount={data.deletedDataInPeriod.deletedChildCount}
              latestResolvedDateLabel={formatDate(data.deletedDataInPeriod.latestResolvedAtIso.slice(0, 10))}
              messages={messages}
            />
          ) : null}
          {selectedTableRow?.totals ? (
            <KpiTiles
              totals={selectedTableRow.totals}
              diff={selectedTableRow.diff}
              hasPreviousYear={selectedTableRow.hasPreviousYear}
              comparisonReliable={selectedTableRow.comparisonReliable}
              previousYearName={selectedTableRow.previousYearName}
              messages={messages}
              yearMessages={yearMessages}
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
              {isActiveYear ? (
                <ConductedLessonsTable snapshot={data.conducted} messages={messages} />
              ) : null}
              <MethodologyNote messages={messages} />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
