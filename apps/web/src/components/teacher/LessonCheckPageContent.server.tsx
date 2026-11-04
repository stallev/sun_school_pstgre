import { connection } from "next/server";
import { USER_ROLE } from "@sunschool/domain";
import { notFound } from "next/navigation";
import { CheckScreen } from "@/components/teacher/check-screen.client";
import { LessonVersesAccordion } from "@/components/teacher/LessonVersesAccordion";
import { loadSequentialCheckPage } from "@/data/checks/load-sequential-check-page.server";
import { loadLessonVerseTexts } from "@/data/lessons/load-lesson-verse-texts.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getSchoolTimezone } from "@/lib/i18n/get-school-timezone.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { formatLessonDisplayDate } from "@/lib/lesson/format-lesson-display-date";
import { getDictionary } from "@/lib/messages/get-dictionary";
import {
  buildLessonCheckDescription,
  pickTeacherCheckMessages,
} from "@/lib/messages/pick-teacher-check-messages.server";
import { fillMessage } from "@/lib/messages/fill-message";

export type LessonCheckPageProps = {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ pupil?: string }>;
};

export const LessonCheckPageContent = async ({ params, searchParams }: LessonCheckPageProps) => {
  await connection();
  const { lessonId } = await params;
  const { pupil: pupilParam } = await searchParams;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const isAdmin = actor.roles.includes(USER_ROLE.ADMIN);
  const locale = await getUiLocale();
  const appLocale = messageLocaleToAppLocale(locale);
  const timeZone = await getSchoolTimezone();
  const db = await getPrisma();
  const data = await loadSequentialCheckPage(db, actor.userId, lessonId, isAdmin);
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
  const lessonDescription = buildLessonCheckDescription(
    teacherDict,
    appLocale,
    data.lessonOrdinal,
    data.lessonTitle,
    lessonDateLabel,
  );

  const verses = await loadLessonVerseTexts(db, { id: data.lessonId, kind: data.lessonKind }, messageLocaleToAppLocale(locale));

  return (
    <CheckScreen
      data={data}
      initialPupilId={pupilParam ?? null}
      lessonDescription={lessonDescription}
      messages={messages}
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

