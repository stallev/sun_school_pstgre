import { connection } from "next/server";
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
import { PupilAchievementPanel } from "@/components/achievements/PupilAchievementPanel.server";
import { TeacherPupilFamilyContactsCard } from "@/components/teacher/TeacherPupilFamilyContactsCard.server";
import { PupilAnalyticsKpiSection } from "@/components/analytics/PupilAnalyticsKpiSection";
import { PupilLessonTable } from "@/components/analytics/PupilLessonTable";
import { PupilPresenceStrip } from "@/components/analytics/PupilPresenceStrip";
import { AnalyticsYearDetail } from "@/components/analytics/years/AnalyticsYearDetail.client";
import { AnalyticsYearScope } from "@/components/analytics/years/AnalyticsYearScope.client";
import { PupilAnalyticsYearNav } from "@/components/analytics/years/PupilAnalyticsYearNav.client";
import { PupilClosedYearKpiTiles } from "@/components/analytics/years/PupilClosedYearKpiTiles";
import { MethodologyVersionNote } from "@/components/analytics/years/MethodologyVersionNote";
import { ReadOnlyYearNote } from "@/components/analytics/years/ReadOnlyYearNote";
import { ContentText } from "@/components/atoms/ContentText";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { Banner } from "@/components/patterns/Banner";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ErrorState } from "@/components/patterns/ErrorState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { CustomLink } from "@/components/ui/custom-link";
import { Skeleton } from "@/components/ui/skeleton";
import { loadPupilAnalyticsPage } from "@/data/analytics/load-pupil-analytics-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getFormDateFieldCopy } from "@/lib/i18n/get-form-date-field-copy";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { fillMessage } from "@/lib/messages/fill-message";
import { pickPupilAnalyticsMessages } from "@/lib/messages/pick-analytics-messages.server";
import type { PupilAnalyticsMessages } from "@/lib/messages/analytics-messages";

export type PupilAnalyticsPageProps = {
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

export const PupilAnalyticsPageContent = async ({ params, searchParams }: PupilAnalyticsPageProps) => {
  await connection();
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

  const sampleReason = snapshot ? sampleLayerReason(snapshot.sampleLayer, messages) : messages.sampleIncluded;
  const birthYearPart =
    data.birthYear === null
      ? messages.pupilBirthYearUnknown
      : fillMessage(messages.pupilBirthYear, { year: data.birthYear });
  const statusPart = data.isActive ? messages.pupilStatusActive : messages.pupilStatusInactive;
  const headerDescription = `${birthYearPart} · ${gradeLabels} · ${statusPart}`;
  const showLessonCorrect = isActiveYear && !isForeignGroupYearSnapshot;

  const chartToggleProps = {
    messages: messages.charts,
    locale: appLocale,
    valueKind: "chart" as const,
    percentTemplate: messages.formatPercent,
    chartValueTemplate: messages.formatChartValue,
    emptyLabel: messages.kpiEmpty,
    minChartPoints: 1,
  };

  const lessonCharts = view === null ? null : (
    <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
      <div className="h-full">
        <ChartTableToggle
          chartId="pupil-verses"
          title={messages.charts.versesTitle}
          methodology={messages.charts.methodologyVerses}
          points={view.charts.verses}
          yDomain={[0, 3]}
          {...chartToggleProps}
        />
      </div>
      <div className="h-full">
        <ChartTableToggle
          chartId="pupil-test"
          title={messages.charts.testTitle}
          methodology={messages.charts.methodologyTest}
          points={view.charts.test}
          yDomain={[0, 10]}
          {...chartToggleProps}
        />
      </div>
      <div className="h-full">
        <ChartTableToggle
          chartId="pupil-notebook"
          title={messages.charts.notebookTitle}
          methodology={messages.charts.methodologyNotebook}
          points={view.charts.notebook}
          yDomain={[0, 10]}
          {...chartToggleProps}
        />
      </div>
    </div>
  );

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
      <PageHeader
        title={data.pupilName}
        description={headerDescription}
        actions={
          data.backToGroupGradeId ? (
            <CustomLink href={`/analytics?gradeId=${data.backToGroupGradeId}`}>
              {messages.backToGroupAnalytics}
            </CustomLink>
          ) : undefined
        }
      />
      <TeacherPupilFamilyContactsCard
        actorUserId={actor.userId}
        actorRoles={actor.roles}
        pupilId={pupilId}
      />
      <AnalyticsYearScope committedYearId={data.yearId}>
      <Suspense fallback={<PupilYearsFallback />}>
        <PupilAnalyticsYearNav
          pupilYearRows={data.pupilYearRows.rows}
          selectedYearId={data.yearId}
          selectedMetric={data.chartMetric}
          showForeignGroupNote={showForeignGroupNote}
          messages={messages}
        />
      </Suspense>
      <AnalyticsYearDetail pendingLabel={yearMessages.detailPending}>
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
          dateFieldCopy={getFormDateFieldCopy(commonDict, locale)}
        />
      ) : null}
      {view ? (
        <Banner
          className="mb-6 max-w-3xl items-start px-4 py-3"
          tone={view.isInMainSample ? "success" : "warning"}
          title={fillMessage(messages.sampleInGroupAverages, {
            included: view.isInMainSample ? messages.sampleIncludedYes : messages.sampleIncludedNo,
          })}
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
      {isActiveYear && view ? (
        <>
          <div className="mb-6">
            <PupilAnalyticsKpiSection view={view} messages={messages} />
          </div>
          <PupilAchievementPanel
            actorUserId={actor.userId}
            pupilId={pupilId}
            gradeId={data.gradeId}
            academicYearId={data.yearId}
            yearClosed={selectedYearRow?.status === ACADEMIC_YEAR_STATUS.CLOSED}
          />
          <div className="mb-4">
            <DynamicsBlock dynamics={view.dynamics} messages={messages} locale={appLocale} />
          </div>
          <section className="mb-4 min-w-0">
            <SectionTitle as="h2" className="mb-2">
              {messages.presenceTitle}
            </SectionTitle>
            <PupilPresenceStrip
              segments={view.presence}
              messages={messages}
              locale={appLocale}
            />
          </section>
          {lessonCharts}
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
          pupilId={pupilId}
          lessons={snapshot.lessons}
          messages={messages}
          locale={appLocale}
          showCorrectActions={showLessonCorrect}
        />
      ) : null}
      </AnalyticsYearDetail>
      </AnalyticsYearScope>
    </div>
  );
};

