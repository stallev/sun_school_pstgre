import { USER_ROLE } from "@sunschool/domain";
import { AnalyticsRetryButton } from "@/components/analytics/AnalyticsRetryButton.client";
import { buildGroupYearTableRows } from "@/components/analytics/years/build-group-year-table-rows";
import { GroupYearSummarySection } from "@/components/analytics/years/GroupYearSummarySection";
import { Banner } from "@/components/patterns/Banner";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ErrorState } from "@/components/patterns/ErrorState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { RosterTable } from "@/components/teacher/RosterTable";
import { loadGroupYearSummaryPage } from "@/data/school/load-group-year-summary.server";
import { isoTodayUtc } from "@/data/school/school-pupil-shared.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickAnalyticsMessages } from "@/lib/messages/pick-analytics-messages.server";
import { fillMessage } from "@/lib/messages/fill-message";
import { pickTeacherRosterMessages } from "@/lib/messages/pick-teacher-roster-messages.server";

type GroupPageProps = {
  searchParams: Promise<{ year?: string }>;
};

const GroupPage = async ({ searchParams }: GroupPageProps) => {
  const params = await searchParams;
  const actor = await requireRole(USER_ROLE.TEACHER);
  const prisma = await getPrisma();
  const data = await loadGroupYearSummaryPage(prisma, actor.userId, params.year);
  const locale = await getUiLocale();
  const [teacherDict, commonDict, adminDict, analyticsDict] = await Promise.all([
    getDictionary(locale, "teacher"),
    getDictionary(locale, "common"),
    getDictionary(locale, "admin"),
    getDictionary(locale, "analytics"),
  ]);
  const messages = pickTeacherRosterMessages(teacherDict);
  const analyticsMessages = pickAnalyticsMessages(analyticsDict);
  const dictionaries = { teacher: teacherDict, common: commonDict, admin: adminDict };
  const formError = getMessage(commonDict, "errors.form");
  const defaultDate = isoTodayUtc();
  const retryLabel = getMessage(commonDict, "states.error_retry");

  if (data.kind === "no_active_year") {
    return (
      <div className="space-y-6">
        <PageHeader title={messages.pageTitle} />
        <EmptyState title={messages.noYearTitle} description={messages.noYearDescription} />
      </div>
    );
  }

  if (data.kind === "unassigned") {
    return (
      <div className="space-y-6">
        <PageHeader title={messages.pageTitle} />
        <EmptyState title={messages.unassignedTitle} description={messages.unassignedDescription} />
      </div>
    );
  }

  if (data.kind === "snapshot_missing") {
    return (
      <div className="space-y-6">
        <PageHeader title={messages.pageTitle} />
        <ErrorState
          title={analyticsMessages.years.snapshotMissing}
          action={<AnalyticsRetryButton retryLabel={retryLabel} />}
        />
      </div>
    );
  }

  const canMutate = !data.yearClosed;
  const yearTotals = "yearTotals" in data ? data.yearTotals : null;
  const tableRows = yearTotals ? buildGroupYearTableRows(yearTotals.rows) : [];
  const selectedYearRow = tableRows.find((row) => row.yearId === yearTotals?.selectedYearId);
  const analyticsHref = yearTotals
    ? `/analytics?year=${encodeURIComponent(yearTotals.selectedYearId)}`
    : "/analytics";

  return (
    <div className="space-y-6">
      <PageHeader
        title={messages.pageTitle}
        description={fillMessage(messages.pageSubtitle, {
          group: data.gradeName,
          count: data.pupils.length,
        })}
      />
      {data.yearClosed ? (
        <Banner tone="warning" title={messages.yearClosedTitle}>
          <p>{messages.yearClosedDescription}</p>
        </Banner>
      ) : null}
      {selectedYearRow ? (
        <GroupYearSummarySection
          yearRow={selectedYearRow}
          analyticsHref={analyticsHref}
          messages={analyticsMessages}
        />
      ) : null}
      {data.pupils.length === 0 && data.addCandidates.length === 0 ? (
        <EmptyState title={messages.emptyTitle} description={messages.emptyDescription} />
      ) : (
        <RosterTable
          gradeId={data.gradeId}
          pupils={data.pupils}
          addCandidates={data.addCandidates}
          canMutate={canMutate}
          defaultDate={defaultDate}
          messages={messages}
          dictionaries={dictionaries}
          formError={formError}
        />
      )}
    </div>
  );
};

export default GroupPage;
