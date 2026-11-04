import { renderToStaticMarkup } from "react-dom/server";
import { APP_LOCALE, LESSON_KIND, LESSON_STATUS } from "@sunschool/domain";
import { describe, expect, it } from "vitest";
import teacherRu from "@/lib/messages/ru/teacher.json";
import { pickTeacherLessonScreensMessages } from "@/lib/messages/pick-teacher-lesson-screens-messages.server";
import { TodayLessonCard } from "@/components/teacher/TodayLessonCard";

const messages = pickTeacherLessonScreensMessages(teacherRu, APP_LOCALE.RU);

describe("TodayLessonCard (P26-T6)", () => {
  it("renders lesson heading without duplicate title and without stray progress marker", () => {
    const html = renderToStaticMarkup(
      <TodayLessonCard
        lesson={{
          lessonId: "l1",
          ordinal: 5,
          title: "Урок 5",
          lessonDateLabel: "4 октября",
          lessonDateIso: "2026-10-04",
          verseRefsLabel: "Быт 1:1",
          checkedCount: 10,
          totalPupils: 30,
          kind: LESSON_KIND.REGULAR,
          status: LESSON_STATUS.HELD,
          leadName: "Иванова",
        }}
        gradeId="g1"
        yearClosed={false}
        canMutate
        messages={messages}
      />,
    );

    expect(html).toContain("Урок 5 · 4 октября");
    expect(html).not.toContain("Урок 5 · Урок 5");
    expect(html).toContain("Проверено 10 из 30");
    expect(html).not.toMatch(/>x</);
  });
});
