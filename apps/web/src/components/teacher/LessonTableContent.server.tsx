import { connection } from "next/server";
import { USER_ROLE } from "@sunschool/domain";
import { notFound } from "next/navigation";
import { LessonCheckTable } from "@/components/teacher/LessonCheckTable";
import { LessonVersesAccordion } from "@/components/teacher/LessonVersesAccordion";
import { loadLessonTablePage } from "@/data/checks/load-lesson-table-page.server";
import { loadLessonVerseTexts } from "@/data/lessons/load-lesson-verse-texts.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getSchoolTimezone } from "@/lib/i18n/get-school-timezone.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { formatLessonDisplayDate } from "@/lib/lesson/format-lesson-display-date";
import { getDictionary } from "@/lib/messages/get-dictionary";
import {
  buildLessonCheckDescription,
  pickTeacherCheckMessages,
} from "@/lib/messages/pick-teacher-check-messages.server";
import { pickTeacherAchievementsMessages } from "@/lib/messages/pick-teacher-achievements-messages.server";
import { fillMessage } from "@/lib/messages/fill-message";

type LessonTableContentProps = {
  params: Promise<{ lessonId: string }>;
};

export const LessonTableContent = async ({ params }: LessonTableContentProps) => {
  await connection();
  const { lessonId } = await params;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const isAdmin = actor.roles.includes(USER_ROLE.ADMIN);
  const locale = await getUiLocale();
  const appLocale = messageLocaleToAppLocale(locale);
  const timeZone = await getSchoolTimezone();
  const db = await getPrisma();
  const data = await loadLessonTablePage(db, actor.userId, lessonId, isAdmin, locale, timeZone);
  const [teacherDict, commonDict] = await Promise.all([
    getDictionary(locale, "teacher"),
    getDictionary(locale, "common"),
  ]);
  const messages = pickTeacherCheckMessages(teacherDict, commonDict);
  const achievementMessages = pickTeacherAchievementsMessages(teacherDict);
  const dictionaries = { teacher: teacherDict, common: commonDict };

  if (data.kind === "not_found") {
    notFound();
  }

  const lessonDateLabel = formatLessonDisplayDate(data.lessonDateIso, { locale, timeZone });
  const lessonDescription = buildLessonCheckDescription(
    teacherDict,
    appLocale,
    data.lessonOrdinal,
    data.lessonTitle,
    lessonDateLabel,
  );
  const verses = await loadLessonVerseTexts(db, { id: data.lessonId, kind: data.lessonKind }, messageLocaleToAppLocale(locale));

  return (
    <LessonCheckTable
      data={data}
      lessonDescription={lessonDescription}
      lessonDateLabel={lessonDateLabel}
      messages={messages}
      achievementMessages={achievementMessages}
      dictionaries={dictionaries}
      versesAccordion={
        <LessonVersesAccordion
          title={fillMessage(messages.versesAccordionTitle, { ordinal: data.lessonOrdinal })}
          verses={verses}
          missingLabel={messages.versesAccordionMissing}
        />
      }
    />
  );
};
