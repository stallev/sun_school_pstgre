import { USER_ROLE } from "@sunschool/domain";
import { Banner } from "@/components/patterns/Banner";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { RosterTable } from "@/components/teacher/RosterTable";
import { loadTeacherGroupPage } from "@/data/school/load-teacher-group-page.server";
import { isoTodayUtc } from "@/data/school/school-pupil-shared.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickTeacherRosterMessages } from "@/lib/messages/pick-teacher-roster-messages.server";

const GroupPage = async () => {
  const actor = await requireRole(USER_ROLE.TEACHER);
  const prisma = await getPrisma();
  const data = await loadTeacherGroupPage(prisma, actor.userId);
  const locale = await getUiLocale();
  const [teacherDict, commonDict, adminDict] = await Promise.all([
    getDictionary(locale, "teacher"),
    getDictionary(locale, "common"),
    getDictionary(locale, "admin"),
  ]);
  const messages = pickTeacherRosterMessages(teacherDict);
  const dictionaries = { teacher: teacherDict, common: commonDict, admin: adminDict };
  const formError = getMessage(commonDict, "errors.form");
  const defaultDate = isoTodayUtc();

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

  const canMutate = !data.yearClosed;

  return (
    <div className="space-y-6">
      <PageHeader
        title={messages.pageTitle}
        description={messages.pageSubtitle(data.gradeName, data.pupils.length)}
      />
      {data.yearClosed ? (
        <Banner tone="warning" title={messages.yearClosedTitle}>
          <p>{messages.yearClosedDescription}</p>
        </Banner>
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
