import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  ACADEMIC_YEAR_STATUS,
  ANALYTICS_METHODOLOGY_VERSION,
  SAMPLE_LAYER,
  USER_ROLE,
  type SampleLayer,
} from "@sunschool/domain";
import { AnalyticsPeriodFilter } from "@/components/analytics/AnalyticsPeriodFilter";
import { AnalyticsRetryButton } from "@/components/analytics/AnalyticsRetryButton.client";
import { ChartTableToggle } from "@/components/analytics/ChartTableToggle";
import { DynamicsBlock } from "@/components/analytics/DynamicsBlock";
import { PupilLessonTable } from "@/components/analytics/PupilLessonTable";
import { PupilAnalyticsYearNav } from "@/components/analytics/years/PupilAnalyticsYearNav.client";
import { PupilClosedYearKpiTiles } from "@/components/analytics/years/PupilClosedYearKpiTiles";
import { MethodologyVersionNote } from "@/components/analytics/years/MethodologyVersionNote";
import { ReadOnlyYearNote } from "@/components/analytics/years/ReadOnlyYearNote";
import { ContentText } from "@/components/atoms/ContentText";
import { NumberDisplay } from "@/components/atoms/NumberDisplay";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { Banner } from "@/components/patterns/Banner";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ErrorState } from "@/components/patterns/ErrorState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Card } from "@/components/ui/card";
import { CustomLink } from "@/components/ui/custom-link";
import { Skeleton } from "@/components/ui/skeleton";
import { loadPupilAnalyticsPage } from "@/data/analytics/load-pupil-analytics-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickPupilAnalyticsMessages } from "@/lib/messages/pick-analytics-messages.server";
import type { PupilAnalyticsMessages } from "@/lib/messages/analytics-messages";

type PupilAnalyticsPageProps = {
  params: Promise<{ pupilId: string }>;
  searchParams: Promise<{
    gradeId?: string;
    pupilYear?: string;
    metric?: string;
    mode?: string;
    month?: string;
    from?: string;
    to?: string;
  }>;
};

const PupilYearsFallback = () => (
  <div className="mb-6 space-y-4" aria-busy="true">
    <Skeleton className="h-7 w-40" />
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-11 w-28 rounded-lg" />
      ))}
    </div>
    <Skeleton className="h-48 w-full rounded-xl" />
    <Skeleton className="h-64 w-full rounded-xl" />
  </div>
);

const sampleLayerReason = (layer: SampleLayer, messages: PupilAnalyticsMessages): string => {
  switch (layer) {
    case SAMPLE_LAYER.B:
      return messages.sampleExcludedB;
    case SAMPLE_LAYER.C:
      return messages.sampleExcludedC;
    case SAMPLE_LAYER.D:
      return messages.sampleExcludedD;
    default:
      return messages.sampleIncluded;
  }
};

const formatPersonalMetric = (
  average: number | null,
  n: number,
  messages: PupilAnalyticsMessages,
  isMain: boolean,
): string => {
  if (average === null || n === 0) return messages.kpiEmpty;
  const value = messages.formatAverage(Number(average.toFixed(1)));
  const core = messages.kpiWithN(value, n);
  return isMain ? core : `${core} ${messages.personalMetricSuffix}`;
};

const PupilAnalyticsPage = async ({ params, searchParams }: PupilAnalyticsPageProps) => {
  const { pupilId } = await params;
  const query = await searchParams;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const locale = await getUiLocale();
  const appLocale = messageLocaleToAppLocale(locale);
  const analyticsDict = await getDictionary(locale, "analytics");
  const commonDict = await getDictionary(locale, "common");
  const teacherDict = await getDictionary(locale, "teacher");
  const messages = pickPupilAnalyticsMessages(analyticsDict);
  const yearMessages = messages.years;
  const data = await loadPupilAnalyticsPage(
    await getPrisma(),
    actor.userId,
    pupilId,
    query,
    messages.attendanceChecked,
  );

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(appLocale, { day: "numeric", month: "short" }).format(
      new Date(`${iso}T12:00:00Z`),
    );
  const formatDelta = (value: number) => {
    const sign = value > 0 ? "+" : value < 0 ? "−" : "";
    return `${sign}${Math.abs(value).toFixed(1)}`;
  };
  const retryLabel = getMessage(commonDict, "states.error_retry");

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

  if (data.kind === "snapshot_missing") {
    return (
      <div className="space-y-6">
        <PageHeader title={messages.pageTitle} />
        <ErrorState
          title={yearMessages.snapshotMissing}
          action={<AnalyticsRetryButton retryLabel={retryLabel} />}
        />
      </div>
    );
  }

  const { view, snapshot } = data;
  const isForeignGroupYearSnapshot = data.isForeignGroupYearSnapshot;
  const selectedYearRow = data.pupilYearRows.rows.find((row) => row.yearId === data.yearId);
  const isActiveYear =
    !isForeignGroupYearSnapshot && selectedYearRow?.status === ACADEMIC_YEAR_STATUS.ACTIVE;
  const gradeLabels = selectedYearRow?.gradeLabels ?? "";
  const showForeignGroupNote = data.pupilYearRows.rows.some((row) => row.hasForeignGroupForTeacher);
  const showStaleMethodology =
    selectedYearRow &&
    selectedYearRow.methodologyVersion !== ANALYTICS_METHODOLOGY_VERSION;
  const periodHiddenFields = {
    pupilYear: data.yearId,
    metric: data.chartMetric,
  };

  const attendancePercent =
    snapshot?.attendanceRate === null || snapshot === null
      ? messages.kpiEmpty
      : messages.formatPercent(Number(snapshot.attendanceRate.toFixed(1)));
  const sampleReason = snapshot ? sampleLayerReason(snapshot.sampleLayer, messages) : messages.sampleIncluded;
  const kpiCards: [string, string, boolean][] | null =
    view === null
      ? null
      : [
          [messages.kpiAttendanceLabel, attendancePercent, false],
          [
            messages.kpiVersesLabel,
            formatPersonalMetric(
              view.versesAverage.average,
              view.versesAverage.observationCount,
              messages,
              view.isInMainSample,
            ),
            false,
          ],
          [
            messages.kpiTestLabel,
            formatPersonalMetric(
              view.testAverage.average,
              view.testAverage.observationCount,
              messages,
              view.isInMainSample,
            ),
            false,
          ],
          [
            messages.kpiNotebookLabel,
            formatPersonalMetric(
              view.notebookAverage.average,
              view.notebookAverage.observationCount,
              messages,
              view.isInMainSample,
            ),
            false,
          ],
        ];

  const lessonCharts = view === null ? null : (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartTableToggle
        chartId="pupil-verses"
        title={messages.charts.versesTitle}
        methodology={messages.charts.methodologyVerses}
        points={view.charts.verses}
        messages={messages.charts}
        formatDate={formatDate}
        formatValue={messages.formatChartValue}
        yDomain={[0, 3]}
      />
      <ChartTableToggle
        chartId="pupil-test"
        title={messages.charts.testTitle}
        methodology={messages.charts.methodologyTest}
        points={view.charts.test}
        messages={messages.charts}
        formatDate={formatDate}
        formatValue={messages.formatChartValue}
        yDomain={[0, 10]}
      />
      <ChartTableToggle
        chartId="pupil-notebook"
        title={messages.charts.notebookTitle}
        methodology={messages.charts.methodologyNotebook}
        points={view.charts.notebook}
        messages={messages.charts}
        formatDate={formatDate}
        formatValue={messages.formatChartValue}
        yDomain={[0, 10]}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.pupilName}
        description={messages.pageSubtitle(gradeLabels, data.yearName)}
        actions={
          data.backToGroupGradeId ? (
            <CustomLink href={`/analytics?gradeId=${data.backToGroupGradeId}`}>
              {messages.backToGroupAnalytics}
            </CustomLink>
          ) : undefined
        }
      />
      <Suspense fallback={<PupilYearsFallback />}>
        <PupilAnalyticsYearNav
          pupilYearRows={data.pupilYearRows.rows}
          selectedYearId={data.yearId}
          selectedMetric={data.chartMetric}
          showForeignGroupNote={showForeignGroupNote}
          messages={messages}
        />
      </Suspense>
      {isForeignGroupYearSnapshot || !isActiveYear ? (
        <ReadOnlyYearNote messages={yearMessages} />
      ) : null}
      {showStaleMethodology && selectedYearRow ? (
        <MethodologyVersionNote
          snapshotVersion={selectedYearRow.methodologyVersion}
          currentVersion={ANALYTICS_METHODOLOGY_VERSION}
          messages={yearMessages}
        />
      ) : null}
      {isActiveYear ? (
        <AnalyticsPeriodFilter
          gradeId={data.gradeId}
          periodFilter={data.periodFilter}
          messages={messages}
          actionPath={`/analytics/pupils/${pupilId}`}
          hiddenFields={periodHiddenFields}
        />
      ) : null}
      {view ? (
        <Banner
          tone={view.isInMainSample ? "success" : "warning"}
          title={messages.sampleInGroupAverages(view.isInMainSample)}
        >
          <ContentText className="text-sm text-ink-2">
            {sampleReason}
            {view.attendanceCheckedLabel ? ` ${messages.kpiAttendanceLabel}: ${view.attendanceCheckedLabel}.` : ""}
          </ContentText>
        </Banner>
      ) : null}
      {isForeignGroupYearSnapshot && selectedYearRow?.totals ? (
        <PupilClosedYearKpiTiles
          totals={selectedYearRow.totals}
          bricksIssued={selectedYearRow.bricksIssued}
          insufficientLessons={selectedYearRow.insufficientLessons}
          messages={messages}
          pupilYearMessages={messages.pupilYears}
        />
      ) : null}
      {isActiveYear && kpiCards ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map(([label, value]) => (
              <Card key={String(label)} className="flex flex-col gap-2 p-4">
                <SectionTitle as="h2" className="text-base">{label}</SectionTitle>
                <NumberDisplay className="text-2xl">{value}</NumberDisplay>
              </Card>
            ))}
          </div>
          <section className="space-y-2">
            <SectionTitle as="h2" className="text-lg">{messages.presenceTitle}</SectionTitle>
            <div className="flex flex-wrap gap-1" role="list" aria-label={messages.presenceTitle}>
              {view!.presence.map((segment) => (
                <span
                  key={segment.lessonId}
                  role="listitem"
                  title={`${formatDate(segment.lessonDate)} — ${
                    segment.state === "present"
                      ? messages.presencePresent
                      : segment.state === "absent"
                        ? messages.presenceAbsent
                        : messages.presenceMissing
                  }`}
                  className={`h-6 w-3 rounded-sm ${
                    segment.state === "present"
                      ? "bg-ok"
                      : segment.state === "absent"
                        ? "bg-line-strong"
                        : "bg-paper border border-line"
                  }`}
                />
              ))}
            </div>
          </section>
          {lessonCharts}
          <DynamicsBlock
            dynamics={view!.dynamics}
            messages={messages}
            formatDate={formatDate}
            formatPercent={(value) => messages.formatPercent(Number(value.toFixed(1)))}
            formatDelta={formatDelta}
          />
        </>
      ) : selectedYearRow?.totals && !isForeignGroupYearSnapshot ? (
        <>
          <PupilClosedYearKpiTiles
            totals={selectedYearRow.totals}
            bricksIssued={selectedYearRow.bricksIssued}
            insufficientLessons={selectedYearRow.insufficientLessons}
            messages={messages}
            pupilYearMessages={messages.pupilYears}
          />
          {lessonCharts}
        </>
      ) : null}
      {snapshot ? (
        <PupilLessonTable
          lessons={snapshot.lessons}
          messages={messages}
          formatDate={formatDate}
          formatLateDate={formatDate}
        />
      ) : null}
    </div>
  );
};

export default PupilAnalyticsPage;
