import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ACADEMIC_YEAR_STATUS, ANALYTICS_METHODOLOGY_VERSION, USER_ROLE } from "@sunschool/domain";
import { AnalyticsPeriodFilter } from "@/components/analytics/AnalyticsPeriodFilter";
import { SchoolAttendanceChart } from "@/components/analytics/SchoolAttendanceChart";
import { SchoolAttentionList } from "@/components/analytics/SchoolAttentionList";
import { SchoolGroupsTable } from "@/components/analytics/SchoolGroupsTable";
import { AnalyticsRetryButton } from "@/components/analytics/AnalyticsRetryButton.client";
import { AnalyticsYearDetail } from "@/components/analytics/years/AnalyticsYearDetail.client";
import { AnalyticsYearScope } from "@/components/analytics/years/AnalyticsYearScope.client";
import { MethodologyVersionNote } from "@/components/analytics/years/MethodologyVersionNote";
import { SchoolAnalyticsYearNav } from "@/components/analytics/years/SchoolAnalyticsYearNav.client";
import { SchoolClosedGroupsTable } from "@/components/analytics/years/SchoolClosedGroupsTable";
import { ContentText } from "@/components/atoms/ContentText";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ErrorState } from "@/components/patterns/ErrorState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { loadSchoolAnalyticsPage } from "@/data/analytics/load-school-analytics-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { formatPlural, getPluralForms } from "@/lib/messages/plural";
import { getFormDateFieldCopy } from "@/lib/i18n/get-form-date-field-copy";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { fillMessage } from "@/lib/messages/fill-message";
import { pickAnalyticsMessages } from "@/lib/messages/pick-analytics-messages.server";

type SchoolAnalyticsRegionsProps = {
  searchParams: {
    gradeId?: string;
    year?: string;
    mode?: string;
    month?: string;
    from?: string;
    to?: string;
  };
};

const YearNavFallback = () => (
  <div className="mb-5 flex flex-wrap gap-2" aria-busy="true">
    {Array.from({ length: 3 }).map((_, index) => (
      <Skeleton key={index} className="h-11 w-28 rounded-lg" />
    ))}
  </div>
);

export const SchoolAnalyticsRegions = async ({ searchParams }: SchoolAnalyticsRegionsProps) => {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const data = await loadSchoolAnalyticsPage(await getPrisma(), actor.userId, searchParams);
  const locale = await getUiLocale();
  const appLocale = messageLocaleToAppLocale(locale);
  const analyticsDict = await getDictionary(locale, "analytics");
  const commonDict = await getDictionary(locale, "common");
  const teacherDict = await getDictionary(locale, "teacher");
  const messages = pickAnalyticsMessages(analyticsDict);
  const yearMessages = messages.years;
  const schoolMessages = messages.school;

  if (data.kind === "forbidden" || data.kind === "not_found") notFound();

  if (data.kind === "no_active_year") {
    return (
      <EmptyState
        title={getMessage(teacherDict, "lesson.no_year_title")}
        description={getMessage(analyticsDict, "years.none")}
      />
    );
  }

  if (data.kind === "snapshot_missing") {
    const retryLabel = getMessage(commonDict, "states.error_retry");
    return (
      <ErrorState
        title={yearMessages.snapshotMissing}
        action={<AnalyticsRetryButton retryLabel={retryLabel} />}
      />
    );
  }

  const selectedStripYear = data.yearStrip.find((row) => row.id === data.yearId);
  const isClosedYear = selectedStripYear?.status === ACADEMIC_YEAR_STATUS.CLOSED;
  const closedTotals = data.schoolYearTotals;
  const showStaleMethodology =
    isClosedYear &&
    closedTotals?.rows.some((row) => row.methodologyVersion !== ANALYTICS_METHODOLOGY_VERSION);
  const periodHiddenFields = { year: data.yearId };
  const periodLessonCount = data.chartLabels.length;
  const lessonsLabel = formatPlural(
    getPluralForms(commonDict, "plural.lessons_count"),
    periodLessonCount,
    locale,
  );
  const pageDescription = isClosedYear
    ? fillMessage(schoolMessages.pageSubtitleClosed, {
        year: data.yearName,
        status: schoolMessages.statusClosed,
      })
    : fillMessage(schoolMessages.pageSubtitleActive, {
        year: data.yearName,
        status: schoolMessages.statusActive,
        lessons: lessonsLabel,
      });

  return (
    <>
      <PageHeader title={schoolMessages.pageTitle} description={pageDescription} />
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
                dateFieldCopy={getFormDateFieldCopy(commonDict, locale)}
              />
              <SchoolGroupsTable
                rows={data.groupRows}
                messages={schoolMessages}
                percentTemplate={messages.formatPercent}
                averageTemplate={messages.formatAverage}
              />
              <section className="mt-8 space-y-2">
                <SectionTitle as="h2" className="text-lg">
                  {schoolMessages.attendanceChartTitle}
                </SectionTitle>
                <ContentText className="mt-1 text-sm text-ink-2">
                  {schoolMessages.attendanceChartHint}
                </ContentText>
                <Card className="mt-4 overflow-visible p-4 sm:p-5">
                  {data.chartLabels.length > 0 ? (
                    <SchoolAttendanceChart
                      labels={data.chartLabels}
                      series={data.chartSeries}
                      locale={appLocale}
                      percentTemplate={messages.formatPercent}
                      ariaLabel={schoolMessages.attendanceChartTitle}
                    />
                  ) : (
                    <EmptyState
                      title={messages.charts.insufficientDataTitle}
                      description={messages.charts.insufficientDataDescription}
                    />
                  )}
                </Card>
              </section>
            </>
          )}
        </AnalyticsYearDetail>
        <SchoolAttentionList
          items={data.attention}
          messages={schoolMessages}
          locale={locale}
        />
      </AnalyticsYearScope>
    </>
  );
};
