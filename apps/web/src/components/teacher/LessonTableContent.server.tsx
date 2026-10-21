import { connection } from "next/server";
import { USER_ROLE } from "@sunschool/domain";
import { notFound } from "next/navigation";
import { LessonCheckTable } from "@/components/teacher/LessonCheckTable";
import { loadLessonTablePage } from "@/data/checks/load-lesson-table-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getSchoolTimezone } from "@/lib/i18n/get-school-timezone.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { formatLessonDisplayDate } from "@/lib/lesson/format-lesson-display-date";
import { getDictionary } from "@/lib/messages/get-dictionary";
import { pickTeacherCheckMessages } from "@/lib/messages/pick-teacher-check-messages.server";

type LessonTableContentProps = {
  params: Promise<{ lessonId: string }>;
};

export const LessonTableContent = async ({ params }: LessonTableContentProps) => {
  await connection();
  const { lessonId } = await params;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const isAdmin = actor.roles.includes(USER_ROLE.ADMIN);
  const locale = await getUiLocale();
  const timeZone = await getSchoolTimezone();
  const data = await loadLessonTablePage(await getPrisma(), actor.userId, lessonId, isAdmin);
  const [teacherDict, commonDict] = await Promise.all([
    getDictionary(locale, "teacher"),
    getDictionary(locale, "common"),
  ]);
  const messages = pickTeacherCheckMessages(teacherDict, commonDict);
  const dictionaries = { teacher: teacherDict, common: commonDict };

  if (data.kind === "not_found") {
    notFound();
  }

  const lessonDateLabel = formatLessonDisplayDate(data.lessonDateIso, { locale, timeZone });

  return (
    <LessonCheckTable
      data={data}
      lessonDateLabel={lessonDateLabel}
      messages={messages}
      dictionaries={dictionaries}
    />
  );
};
