import { APP_LOCALE } from "@sunschool/domain";
import { describe, expect, it } from "vitest";
import teacherRu from "@/lib/messages/ru/teacher.json";
import { pickTeacherLessonScreensMessages } from "@/lib/messages/pick-teacher-lesson-screens-messages.server";
import {
  PUPIL_GRAMMATICAL_GENDER,
  resolvePupilGrammaticalGender,
} from "@/lib/person/resolve-pupil-grammatical-gender";

const messages = pickTeacherLessonScreensMessages(teacherRu, APP_LOCALE.RU);

describe("today screen copy (P25-T6)", () => {
  it("greets without a name when first name is empty", () => {
    expect(messages.todayGreeting("", "evening")).toBe("Добрый вечер!");
  });

  it("formats focal lesson heading as lesson number and date", () => {
    expect(messages.todayLessonHeading(5, "4 октября")).toBe("Урок 5 · 4 октября");
  });

  it("exposes late-week action label for inline link", () => {
    expect(messages.todayWeekLateAction).toBe("Внести оценку");
  });

  it("declines late-week line by pupil grammatical gender", () => {
    expect(
      messages.todayWeekLateValue("Зайцев Тимофей", "18 октября", PUPIL_GRAMMATICAL_GENDER.MALE),
    ).toBe("Зайцев Тимофей принёс тетрадь за 18 октября.");
    expect(
      messages.todayWeekLateValue(
        "Козлова Алиса",
        "27 сентября",
        PUPIL_GRAMMATICAL_GENDER.FEMALE,
      ),
    ).toBe("Козлова Алиса принесла тетрадь за 27 сентября.");
    expect(
      messages.todayWeekLateValue(
        "Иванов Иван",
        "4 октября",
        PUPIL_GRAMMATICAL_GENDER.UNKNOWN,
      ),
    ).toBe("Иванов Иван — тетрадь за 4 октября.");
  });
});

describe("load-today-week late row gender (P25-CU6 blocker)", () => {
  it("maps patronymic from pupil data to message gender", () => {
    expect(resolvePupilGrammaticalGender({ middleName: "Сергеевна" })).toBe(
      PUPIL_GRAMMATICAL_GENDER.FEMALE,
    );
    expect(
      messages.todayWeekLateValue(
        "Козлова Алиса",
        "27 сентября",
        resolvePupilGrammaticalGender({ middleName: "Сергеевна" }),
      ),
    ).toContain("принесла");
  });
});
