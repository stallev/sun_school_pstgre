import { connection } from "next/server";
import { USER_ROLE } from "@sunschool/domain";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { BalanceTable } from "@/components/teacher/BalanceTable";
import { BricksPageSummary } from "@/components/teacher/BricksPageSummary";
import { LessonsGradeFilter } from "@/components/teacher/LessonsGradeFilter";
import { loadBricksPage } from "@/data/bricks/load-bricks-page.server";
import { isoTodayUtc } from "@/data/school/school-pupil-shared.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { fillMessage } from "@/lib/messages/fill-message";
import { pickTeacherAchievementsMessages } from "@/lib/messages/pick-teacher-achievements-messages.server";
import { pickTeacherBricksMessages } from "@/lib/messages/pick-teacher-bricks-messages.server";
import { pickTeacherLessonScreensMessages } from "@/lib/messages/pick-teacher-lesson-screens-messages.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";

type BricksPageContentProps = {
  searchParams: Promise<{ gradeId?: string; pupilId?: string }>;
};

export const BricksPageContent = async ({ searchParams }: BricksPageContentProps) => {
  await connection();
  const params = await searchParams;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const data = await loadBricksPage(
    await getPrisma(),
    actor.userId,
    params.gradeId ?? null,
    params.pupilId ?? null,
  );
  const locale = await getUiLocale();
  const teacherDict = await getDictionary(locale, "teacher");
  const commonDict = await getDictionary(locale, "common");
  const messages = pickTeacherBricksMessages(teacherDict);
  const achievementMessages = pickTeacherAchievementsMessages(teacherDict);
  const lessonMessages = pickTeacherLessonScreensMessages(teacherDict, messageLocaleToAppLocale(locale));
  const formError = getMessage(commonDict, "errors.form");
  const dictionaries = { teacher: teacherDict, common: commonDict };
  const defaultDate = isoTodayUtc();

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
        <EmptyState
          title={lessonMessages.unassignedTitle}
          description={lessonMessages.unassignedDescription}
        />
      </div>
    );
  }

  const hasEarned = data.rows.some((row) => row.earned > 0);
  const totalToIssue = data.rows.reduce((sum, row) => sum + Math.max(0, row.balance), 0);
  const negativeBalanceCount = data.rows.filter((row) => row.balance < 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={messages.pageTitle}
        description={fillMessage(messages.pageSubtitle, {
          group: data.gradeName,
          year: data.yearName,
        })}
      />
      {data.isAdmin && data.grades.length > 1 ? (
        <LessonsGradeFilter
          grades={data.grades}
          gradeId={data.gradeId}
          messages={lessonMessages}
          actionPath="/bricks"
        />
      ) : null}
      {data.rows.length === 0 ? (
        <EmptyState title={messages.emptyPupilsTitle} description={messages.emptyPupilsDescription} />
      ) : !hasEarned ? (
        <EmptyState title={messages.emptyEarnedTitle} description={messages.emptyEarnedDescription} />
      ) : (
        <>
          <BricksPageSummary
            totalToIssue={totalToIssue}
            negativeBalanceCount={negativeBalanceCount}
            messages={messages}
          />
          <BalanceTable
            gradeId={data.gradeId}
            yearId={data.yearId}
            rows={data.rows}
            selectedPupilId={data.selectedPupilId}
            ledger={data.ledger}
            defaultDate={defaultDate}
            messages={messages}
            achievementMessages={data.rows.some((row) => row.achievementsUiEnabled) ? achievementMessages : undefined}
            dictionaries={dictionaries}
            uiLocale={locale}
            formError={formError}
          />
        </>
      )}
    </div>
  );
};
