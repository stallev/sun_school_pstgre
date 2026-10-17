import { USER_ROLE } from "@sunschool/domain";
import { notFound } from "next/navigation";
import { LessonForm } from "@/components/teacher/LessonForm";
import { PageHeader } from "@/components/patterns/PageHeader";
import { CustomLink } from "@/components/ui/custom-link";
import { loadLessonFormEditPage } from "@/data/lessons/load-lesson-form-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickTeacherLessonFormMessages } from "@/lib/messages/pick-teacher-lesson-messages.server";

export const instant = false;

type EditLessonPageProps = {
  params: Promise<{ lessonId: string }>;
};

const EditLessonPage = async ({ params }: EditLessonPageProps) => {
  const { lessonId } = await params;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const data = await loadLessonFormEditPage(await getPrisma(), actor.userId, lessonId);
  const locale = await getUiLocale();
  const [teacherDict, commonDict] = await Promise.all([
    getDictionary(locale, "teacher"),
    getDictionary(locale, "common"),
  ]);
  const messages = pickTeacherLessonFormMessages(teacherDict, messageLocaleToAppLocale(locale));
  const dictionaries = { teacher: teacherDict, common: commonDict };
  const formError = getMessage(commonDict, "errors.form");

  if (data.kind === "not_found" || data.kind === "no_active_year") {
    notFound();
  }

  const gradeName = data.grades.find((g) => g.gradeId === data.gradeId)?.name ?? "";
  const translationLabel = getMessage(
    teacherDict,
    data.translationCode.includes("niv") ? "lesson.translation_niv" : "lesson.translation_rst",
  );
  const title = data.ordinal ? messages.editTitle(data.ordinal) : messages.newTitle;

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={messages.pageSubtitle(gradeName, data.yearName)}
        actions={
          <CustomLink href={`/lessons/${lessonId}`} className="text-sm text-cobalt-ink">
            {messages.backToLesson}
          </CustomLink>
        }
      />
      <LessonForm
        data={data}
        messages={messages}
        translationLabel={translationLabel}
        dictionaries={dictionaries}
        formError={formError}
        cancelHref={`/lessons/${lessonId}`}
      />
    </div>
  );
};

export default EditLessonPage;
