import { connection } from "next/server";
import { USER_ROLE } from "@sunschool/domain";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { loadCheckEntryPage } from "@/data/checks/load-check-entry-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickTeacherCheckMessages } from "@/lib/messages/pick-teacher-check-messages.server";
import { pickTeacherLessonScreensMessages } from "@/lib/messages/pick-teacher-lesson-screens-messages.server";

export const CheckEntryPageContent = async () => {
  await connection();
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const data = await loadCheckEntryPage(await getPrisma(), actor.userId);
  const locale = await getUiLocale();
  const [teacherDict, commonDict] = await Promise.all([
    getDictionary(locale, "teacher"),
    getDictionary(locale, "common"),
  ]);
  const checkMessages = pickTeacherCheckMessages(teacherDict, commonDict);
  const lessonMessages = pickTeacherLessonScreensMessages(
    teacherDict,
    messageLocaleToAppLocale(locale),
  );

  if (data.kind === "redirect") {
    redirect(`/lessons/${data.lessonId}/check`);
  }

  if (data.kind === "no_active_year") {
    return (
      <div className="space-y-6">
        <PageHeader title={checkMessages.pageTitleCheck} />
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
        <PageHeader title={checkMessages.pageTitleCheck} />
        <EmptyState
          title={lessonMessages.unassignedTitle}
          description={lessonMessages.unassignedDescription}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={checkMessages.pageTitleCheck} />
      <EmptyState
        title={checkMessages.entryEmptyTitle}
        description={checkMessages.entryEmptyDescription}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {data.canMutate ? (
              <Button render={<CustomLink href={`/lessons/new?gradeId=${data.gradeId}`} />}>
                {checkMessages.entryActionNewLesson}
              </Button>
            ) : null}
            <Button variant="outline" render={<CustomLink href="/lessons" />}>
              {checkMessages.entryActionAllLessons}
            </Button>
          </div>
        }
      />
    </div>
  );
};

