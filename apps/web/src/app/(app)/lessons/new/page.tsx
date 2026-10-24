import { USER_ROLE } from "@sunschool/domain";
import { notFound } from "next/navigation";
import { LessonForm } from "@/components/teacher/LessonForm";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { CustomLink } from "@/components/ui/custom-link";
import { loadLessonFormCreatePage } from "@/data/lessons/load-lesson-form-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { fillMessage } from "@/lib/messages/fill-message";
import { pickTeacherLessonFormMessages } from "@/lib/messages/pick-teacher-lesson-messages.server";

export const instant = false;

type NewLessonPageProps = {
  searchParams: Promise<{ gradeId?: string }>;
};

const NewLessonPage = async ({ searchParams }: NewLessonPageProps) => {
  const params = await searchParams;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const data = await loadLessonFormCreatePage(await getPrisma(), actor.userId, params.gradeId ?? null);
  const locale = await getUiLocale();
  const [teacherDict, commonDict] = await Promise.all([
    getDictionary(locale, "teacher"),
    getDictionary(locale, "common"),
  ]);
  const messages = pickTeacherLessonFormMessages(teacherDict, messageLocaleToAppLocale(locale));
  const dictionaries = { teacher: teacherDict, common: commonDict };
  const formError = getMessage(commonDict, "errors.form");
  const gradeName = data.kind === "form" ? data.grades.find((g) => g.gradeId === data.gradeId)?.name ?? "" : "";
  const translationLabel = getMessage(
    teacherDict,
    data.kind === "form" && data.translationCode.includes("niv")
      ? "lesson.translation_niv"
      : "lesson.translation_rst",
  );

  if (data.kind === "no_active_year") {
    return (
      <div className="space-y-6">
        <PageHeader title={messages.newTitle} />
        <EmptyState
          title={getMessage(teacherDict, "lesson.no_year_title")}
          description={getMessage(teacherDict, "lesson.no_year_description")}
        />
      </div>
    );
  }

  if (data.kind === "not_found") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={messages.newTitle}
        description={fillMessage(messages.pageSubtitle, { group: gradeName, year: data.yearName })}
        actions={
          <CustomLink href="/lessons" className="text-sm text-cobalt-ink">
            {messages.backToLessons}
          </CustomLink>
        }
      />
      <LessonForm
        data={data}
        messages={messages}
        translationLabel={translationLabel}
        dictionaries={dictionaries}
        uiLocale={locale}
        formError={formError}
        cancelHref="/lessons"
      />
    </div>
  );
};

export default NewLessonPage;
