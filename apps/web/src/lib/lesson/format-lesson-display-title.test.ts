import { APP_LOCALE } from "@sunschool/domain";
import { describe, expect, it } from "vitest";
import {
  formatLessonDisplaySubtitle,
  formatLessonListRowTitle,
  isDefaultLessonTitle,
} from "@/lib/lesson/format-lesson-display-title";

const templates = {
  withDate: "Урок {n} · {date}",
  withTitle: "Урок {n} · {title}",
  ordinalOnly: "Урок {n}",
};

describe("formatLessonDisplaySubtitle (P26-T6)", () => {
  it("uses date when title matches default lesson label", () => {
    expect(
      formatLessonDisplaySubtitle(5, "Урок 5", "4 октября", APP_LOCALE.RU, templates, "урок {n}"),
    ).toBe("Урок 5 · 4 октября");
  });

  it("uses custom title without repeating default label", () => {
    expect(
      formatLessonDisplaySubtitle(5, "Иосиф", "4 октября", APP_LOCALE.RU, templates, "урок {n}"),
    ).toBe("Урок 5 · Иосиф");
  });

  it("omits date tail when date is empty", () => {
    expect(
      formatLessonDisplaySubtitle(5, "Урок 5", "", APP_LOCALE.RU, templates, "урок {n}"),
    ).toBe("Урок 5");
  });

  it("detects default English lesson title", () => {
    expect(isDefaultLessonTitle("Lesson 3", 3, APP_LOCALE.EN, "lesson {n}")).toBe(true);
  });
});

describe("formatLessonListRowTitle", () => {
  it("shows a single ordinal heading for default titles", () => {
    expect(
      formatLessonListRowTitle(5, "урок 5", APP_LOCALE.RU, templates, "урок {n}"),
    ).toBe("Урок 5");
  });
});
