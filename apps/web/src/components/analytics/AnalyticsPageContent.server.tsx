import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ACADEMIC_YEAR_STATUS, USER_ROLE } from "@sunschool/domain";
import { AnalyticsAdminDataQualityRow } from "@/components/analytics/AnalyticsAdminDataQualityRow";
import { AnalyticsGradeChips } from "@/components/analytics/AnalyticsGradeChips";
import { AnalyticsPeriodChips } from "@/components/analytics/AnalyticsPeriodChips";
import { AnalyticsPeriodKpiSection } from "@/components/analytics/AnalyticsPeriodKpiSection";
import { ChartTableToggle } from "@/components/analytics/ChartTableToggle";
import { ConductedLessonsTable } from "@/components/analytics/ConductedLessonsTable";
import { DeletedDataNote } from "@/components/analytics/DeletedDataNote";
import { GroupAnalyticsTables } from "@/components/analytics/GroupAnalyticsTables";
import { MethodologyNote } from "@/components/analytics/MethodologyNote";
import { SampleCompositionRow } from "@/components/analytics/SampleCompositionRow";
import { buildGroupYearTableRows } from "@/components/analytics/years/build-group-year-table-rows";
import { AnalyticsYearDetail } from "@/components/analytics/years/AnalyticsYearDetail.client";
import { AnalyticsYearScope } from "@/components/analytics/years/AnalyticsYearScope.client";
import { GroupAnalyticsYearNav } from "@/components/analytics/years/GroupAnalyticsYearNav.client";
import { GroupYearSelection } from "@/components/analytics/years/GroupYearSelection.client";
import { AnalyticsRetryButton } from "@/components/analytics/AnalyticsRetryButton.client";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ErrorState } from "@/components/patterns/ErrorState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { loadAnalyticsPage } from "@/data/analytics/load-analytics-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { formatAnalyticsShortDate } from "@/lib/analytics/format-analytics-display";
import { fillMessage } from "@/lib/messages/fill-message";
import { pickAnalyticsMessages } from "@/lib/messages/pick-analytics-messages.server";
import { pickTeacherLessonScreensMessages } from "@/lib/messages/pick-teacher-lesson-screens-messages.server";
import { formatPlural, getPluralForms } from "@/lib/messages/plural";
import type { MessageLocale } from "@/lib/messages/dictionary-types";

type AnalyticsPageContentProps = {
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

export const AnalyticsPageContent = async ({ searchParams }: AnalyticsPageContentProps) => {
  const params = await searchParams;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const data = await loadAnalyticsPage(await getPrisma(), actor.userId, params);
  const locale = await getUiLocale();
  const appLocale = messageLocaleToAppLocale(locale);
  const analyticsDict = await getDictionary(locale, "analytics");
  const commonDict = await getDictionary(locale, "common");
  const messageLocale = locale as MessageLocale;
  const teacherDict = await getDictionary(locale, "teacher");
  const messages = pickAnalyticsMessages(analyticsDict);
  const lessonMessages = pickTeacherLessonScreensMessages(teacherDict, appLocale);
  const yearMessages = messages.years;

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
  const selectedYearRow = data.yearTotals.rows.find((row) => row.yearId === data.yearId);
  const isActiveYear = selectedYearRow?.status === ACADEMIC_YEAR_STATUS.ACTIVE;
  const periodLessonCount = analytics.charts.attendance.length;
  const lessonsLabel = formatPlural(
    getPluralForms(commonDict, "plural.lessons_count"),
    periodLessonCount,
    messageLocale,
  );
  const pageDescription = fillMessage(messages.pageSubtitleWithLessons, {
    group: data.gradeName,
    year: data.yearName,
    lessons: lessonsLabel,
  });
  const periodQuery: Record<string, string> = {};
  if (data.periodFilter.mode === "month") {
    periodQuery.mode = "month";
    periodQuery.month = data.periodFilter.month;
  } else if (data.periodFilter.mode === "range") {
    periodQuery.mode = "range";
    periodQuery.from = data.periodFilter.from;
    periodQuery.to = data.periodFilter.to;
  } else {
    periodQuery.mode = "year";
  }
  await connection();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthChipValue =
    data.periodFilter.mode === "month" ? data.periodFilter.month : currentMonth;
  const monthChipLabel =
    data.periodFilter.mode === "month"
      ? data.periodFilter.month
      : messages.periodMonth;

  return (
    <div className="min-w-0 max-w-full overflow-x-hidden">
      <AnalyticsYearScope committedYearId={data.yearId}>
        <div className="space-y-6">
          <PageHeader title={messages.pageTitle} description={pageDescription} />
          {data.isAdmin && data.grades.length > 1 ? (
            <AnalyticsGradeChips
              grades={data.grades}
              gradeId={data.gradeId}
              yearId={data.yearId}
              periodQuery={periodQuery}
              ariaLabel={lessonMessages.gradeFilterLabel}
            />
          ) : null}
          <Suspense fallback={<YearNavFallback />}>
            <GroupAnalyticsYearNav
              groupLabel={data.gradeName}
              tableRows={tableRows}
              messages={messages}
            />
          </Suspense>
          <GroupYearSelection rows={tableRows} messages={messages} />
          {!selectedSnapshotMissing ? (
            <AnalyticsPeriodChips
              gradeId={data.gradeId}
              yearId={data.yearId}
              periodFilter={data.periodFilter}
              messages={messages}
              monthChipValue={monthChipValue}
              monthChipLabel={monthChipLabel}
            />
          ) : null}
        </div>
        {selectedSnapshotMissing ? (
          <AnalyticsYearDetail pendingLabel={yearMessages.detailPending}>
            <ErrorState
              title={yearMessages.snapshotMissing}
              action={<AnalyticsRetryButton retryLabel={retryLabel} />}
            />
          </AnalyticsYearDetail>
        ) : (
          <AnalyticsYearDetail pendingLabel={yearMessages.detailPending}>
          {analytics.hasCheckedLessonsInPeriod ? (
            <AnalyticsPeriodKpiSection snapshot={analytics} messages={messages} />
          ) : null}
          {isActiveYear && data.isAdmin ? (
            <div className="mt-3">
              <AnalyticsAdminDataQualityRow
                missingRecords={data.dataQuality?.missingPupilRecordsOnCheckedLessons ?? 0}
                migrationDuplicates={0}
                messages={messages}
              />
            </div>
          ) : null}
          {isActiveYear &&
          data.isAdmin &&
          data.deletedDataInPeriod &&
          data.deletedDataInPeriod.latestResolvedAtIso ? (
            <DeletedDataNote
              deletedChildCount={data.deletedDataInPeriod.deletedChildCount}
              latestResolvedDateLabel={formatAnalyticsShortDate(
                data.deletedDataInPeriod.latestResolvedAtIso.slice(0, 10),
                appLocale,
              )}
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
              <SampleCompositionRow snapshot={analytics} messages={messages} />
              <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-2 lg:gap-6">
                <ChartTableToggle
                  chartId="attendance"
                  title={messages.charts.attendanceTitle}
                  methodology={messages.charts.methodologyAttendance}
                  points={analytics.charts.attendance}
                  messages={messages.charts}
                  locale={appLocale}
                  valueKind="percent"
                  percentTemplate={messages.formatPercent}
                  chartValueTemplate={messages.formatChartValue}
                  emptyLabel={messages.kpiEmpty}
                  yDomain={[0, 100]}
                />
                <ChartTableToggle
                  chartId="verses"
                  title={messages.charts.versesTitle}
                  methodology={messages.charts.methodologyVerses}
                  points={analytics.charts.verses}
                  messages={messages.charts}
                  locale={appLocale}
                  valueKind="chart"
                  percentTemplate={messages.formatPercent}
                  chartValueTemplate={messages.formatChartValue}
                  emptyLabel={messages.kpiEmpty}
                />
                <ChartTableToggle
                  chartId="test"
                  title={messages.charts.testTitle}
                  methodology={messages.charts.methodologyTest}
                  points={analytics.charts.test}
                  messages={messages.charts}
                  locale={appLocale}
                  valueKind="chart"
                  percentTemplate={messages.formatPercent}
                  chartValueTemplate={messages.formatChartValue}
                  emptyLabel={messages.kpiEmpty}
                  yDomain={[0, 10]}
                />
                <ChartTableToggle
                  chartId="notebook"
                  title={messages.charts.notebookTitle}
                  methodology={messages.charts.methodologyNotebook}
                  points={analytics.charts.notebook}
                  messages={messages.charts}
                  locale={appLocale}
                  valueKind="chart"
                  percentTemplate={messages.formatPercent}
                  chartValueTemplate={messages.formatChartValue}
                  emptyLabel={messages.kpiEmpty}
                  yDomain={[0, 10]}
                />
              </div>
              {isActiveYear ? (
                <ConductedLessonsTable snapshot={data.conducted} messages={messages} />
              ) : null}
              <GroupAnalyticsTables snapshot={analytics} messages={messages} locale={appLocale} />
              <MethodologyNote messages={messages} />
            </>
          )}
          </AnalyticsYearDetail>
        )}
      </AnalyticsYearScope>
    </div>
  );
};

