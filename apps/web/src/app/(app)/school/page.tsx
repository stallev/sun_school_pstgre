import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ACADEMIC_YEAR_STATUS, ANALYTICS_METHODOLOGY_VERSION, USER_ROLE } from "@sunschool/domain";
import { AnalyticsPeriodFilter } from "@/components/analytics/AnalyticsPeriodFilter";
import { ConductedLessonsTable } from "@/components/analytics/ConductedLessonsTable";
import { SchoolAttendanceChart } from "@/components/analytics/SchoolAttendanceChart";
import { SchoolAttentionList } from "@/components/analytics/SchoolAttentionList";
import { SchoolGroupsTable } from "@/components/analytics/SchoolGroupsTable";
import { AnalyticsRetryButton } from "@/components/analytics/AnalyticsRetryButton.client";
import { AnalyticsYearDetail } from "@/components/analytics/years/AnalyticsYearDetail.client";
import { AnalyticsYearScope } from "@/components/analytics/years/AnalyticsYearScope.client";
import { MethodologyVersionNote } from "@/components/analytics/years/MethodologyVersionNote";
import { SchoolAnalyticsYearNav } from "@/components/analytics/years/SchoolAnalyticsYearNav.client";
import { SchoolClosedGroupsTable } from "@/components/analytics/years/SchoolClosedGroupsTable";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ErrorState } from "@/components/patterns/ErrorState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { ContentText } from "@/components/atoms/ContentText";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LessonsGradeFilter } from "@/components/teacher/LessonsGradeFilter";
import { loadSchoolAnalyticsPage } from "@/data/analytics/load-school-analytics-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { fillMessage } from "@/lib/messages/fill-message";
import { pickAnalyticsMessages } from "@/lib/messages/pick-analytics-messages.server";
import { pickTeacherLessonScreensMessages } from "@/lib/messages/pick-teacher-lesson-screens-messages.server";

type SchoolPageProps = {
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
  <div className="mb-5 flex flex-wrap gap-2" aria-busy="true">
    {Array.from({ length: 3 }).map((_, index) => (
      <Skeleton key={index} className="h-11 w-28 rounded-lg" />
    ))}
  </div>
);

const SchoolPage = async ({ searchParams }: SchoolPageProps) => {
  const params = await searchParams;
  const actor = await requireRole(USER_ROLE.ADMIN);
  const data = await loadSchoolAnalyticsPage(await getPrisma(), actor.userId, params);
  const locale = await getUiLocale();
  const appLocale = messageLocaleToAppLocale(locale);
  const analyticsDict = await getDictionary(locale, "analytics");
  const commonDict = await getDictionary(locale, "common");
  const teacherDict = await getDictionary(locale, "teacher");
  const messages = pickAnalyticsMessages(analyticsDict);
  const lessonMessages = pickTeacherLessonScreensMessages(teacherDict, appLocale);
  const yearMessages = messages.years;

  if (data.kind === "forbidden" || data.kind === "not_found") notFound();

  if (data.kind === "no_active_year") {
    return (
      <div className="space-y-6">
        <PageHeader title={messages.school.pageTitle} />
        <EmptyState
          title={getMessage(teacherDict, "lesson.no_year_title")}
          description={getMessage(analyticsDict, "years.none")}
        />
      </div>
    );
  }

  if (data.kind === "snapshot_missing") {
    const retryLabel = getMessage(commonDict, "states.error_retry");
    return (
      <div className="space-y-6">
        <PageHeader title={messages.school.pageTitle} />
        <ErrorState
          title={yearMessages.snapshotMissing}
          action={<AnalyticsRetryButton retryLabel={retryLabel} />}
        />
      </div>
    );
  }

  const selectedStripYear = data.yearStrip.find((row) => row.id === data.yearId);
  const isClosedYear = selectedStripYear?.status === ACADEMIC_YEAR_STATUS.CLOSED;
  const closedTotals = data.schoolYearTotals;
  const showStaleMethodology =
    isClosedYear &&
    closedTotals?.rows.some(
      (row) => row.methodologyVersion !== ANALYTICS_METHODOLOGY_VERSION,
    );
  const periodHiddenFields = { year: data.yearId };

  return (
    <div className="space-y-8">
      <PageHeader
        title={messages.school.pageTitle}
        description={fillMessage(messages.school.pageSubtitle, { year: data.yearName })}
      />
      <SchoolAttentionList items={data.attention} messages={messages.school} />
      <AnalyticsYearScope committedYearId={data.yearId}>
      <Suspense fallback={<YearNavFallback />}>
        <SchoolAnalyticsYearNav years={data.yearStrip} messages={messages} />
      </Suspense>
      <AnalyticsYearDetail pendingLabel={yearMessages.detailPending}>
      {isClosedYear ? (
        <>
          {showStaleMethodology ? (
            <MethodologyVersionNote
              snapshotVersion={
                closedTotals?.rows.find(
                  (row) => row.methodologyVersion !== ANALYTICS_METHODOLOGY_VERSION,
                )?.methodologyVersion ?? ANALYTICS_METHODOLOGY_VERSION
              }
              currentVersion={ANALYTICS_METHODOLOGY_VERSION}
              messages={yearMessages}
            />
          ) : null}
          {closedTotals ? (
            <SchoolClosedGroupsTable
              yearName={closedTotals.yearName}
              rows={closedTotals.rows}
              messages={messages}
            />
          ) : null}
        </>
      ) : (
        <>
          <AnalyticsPeriodFilter
            gradeId={data.gradeId}
            periodFilter={data.periodFilter}
            messages={messages}
            actionPath="/school"
            hiddenFields={periodHiddenFields}
          />
          <SchoolGroupsTable
            rows={data.groupRows}
            messages={messages.school}
            percentTemplate={messages.formatPercent}
          />
          <section className="space-y-2">
            <SectionTitle as="h2" className="text-lg">
              {messages.school.attendanceChartTitle}
            </SectionTitle>
            <ContentText className="text-sm text-muted-foreground">
              {messages.school.attendanceChartHint}
            </ContentText>
            <Card className="overflow-visible p-4">
              <SchoolAttendanceChart
                labels={data.chartLabels}
                series={data.chartSeries}
                locale={appLocale}
                percentTemplate={messages.formatPercent}
                ariaLabel={messages.school.attendanceChartTitle}
              />
            </Card>
          </section>
          {data.grades.length > 1 ? (
            <LessonsGradeFilter
              grades={data.grades}
              gradeId={data.gradeId}
              messages={lessonMessages}
              actionPath="/school"
              hiddenFields={{ mode: data.periodFilter.mode, year: data.yearId }}
            />
          ) : null}
          <div className="space-y-2">
            <SectionTitle as="h2" className="text-lg">
              {messages.school.conductedGradeLabel}
            </SectionTitle>
            <ConductedLessonsTable snapshot={data.conducted} messages={messages} />
          </div>
        </>
      )}
      </AnalyticsYearDetail>
      </AnalyticsYearScope>
    </div>
  );
};

export default SchoolPage;
