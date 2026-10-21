import { USER_ROLE } from "@sunschool/domain";
import { notFound } from "next/navigation";
import { LessonCard } from "@/components/teacher/LessonCard";
import { ContentText } from "@/components/atoms";
import { CustomLink } from "@/components/ui/custom-link";
import { loadLessonDetailPage } from "@/data/lessons/load-lesson-detail-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getSchoolTimezone } from "@/lib/i18n/get-school-timezone.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { formatLessonDisplayDate } from "@/lib/lesson/format-lesson-display-date";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickTeacherLessonFormMessages } from "@/lib/messages/pick-teacher-lesson-messages.server";
import { pickTeacherLessonScreensMessages } from "@/lib/messages/pick-teacher-lesson-screens-messages.server";

type LessonDetailPageProps = {
  params: Promise<{ lessonId: string }>;
};

const LessonDetailPage = async ({ params }: LessonDetailPageProps) => {
  const { lessonId } = await params;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const locale = await getUiLocale();
  const appLocale = messageLocaleToAppLocale(locale);
  const timeZone = await getSchoolTimezone();
  const data = await loadLessonDetailPage(await getPrisma(), actor.userId, lessonId, appLocale);
  const [teacherDict, commonDict] = await Promise.all([
    getDictionary(locale, "teacher"),
    getDictionary(locale, "common"),
  ]);
  const messages = pickTeacherLessonScreensMessages(teacherDict, appLocale);
  const formMessages = pickTeacherLessonFormMessages(teacherDict, appLocale);
  const dictionaries = { teacher: teacherDict, common: commonDict };
  const formError = getMessage(commonDict, "errors.form");

  if (data.kind === "not_found") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <ContentText tone="secondary">{messages.listSubtitle(data.gradeName, data.yearName)}</ContentText>
        <CustomLink href="/lessons" className="text-sm text-cobalt-ink">
          {formMessages.backToLessons}
        </CustomLink>
      </header>
      <LessonCard
        data={data}
        messages={messages}
        dictionaries={dictionaries}
        formError={formError}
        lessonDateLabel={formatLessonDisplayDate(data.lessonDateIso, {
          locale: appLocale,
          timeZone,
        })}
      />
    </div>
  );
};

export default LessonDetailPage;
