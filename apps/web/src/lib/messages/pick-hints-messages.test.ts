import { describe, expect, it } from "vitest";

import adminEn from "@/lib/messages/en/admin.json";
import analyticsEn from "@/lib/messages/en/analytics.json";
import teacherEn from "@/lib/messages/en/teacher.json";
import { pickHintsMessages } from "@/lib/messages/pick-hints-messages";
import adminRu from "@/lib/messages/ru/admin.json";
import analyticsRu from "@/lib/messages/ru/analytics.json";
import teacherRu from "@/lib/messages/ru/teacher.json";
import { ADMIN_HINT_KEYS } from "@/lib/messages/admin-hints-types";
import { ANALYTICS_HINT_KEYS } from "@/lib/messages/analytics-hints-types";
import { TEACHER_HINT_KEYS } from "@/lib/messages/teacher-hints-types";

describe("pickHintsMessages", () => {
  it("returns only requested teacher keys with term and hint", () => {
    const keys = ["bricks_collected", "bricks_left"] as const;
    const picked = pickHintsMessages(teacherRu, keys);
    expect(Object.keys(picked).sort()).toEqual([...keys].sort());
    expect(picked.bricks_collected.term).toBe("Набрано");
    expect(picked.bricks_collected.hint.length).toBeGreaterThan(10);
    expect(picked.bricks_left.term).toBe("Остаток");
  });

  it("throws when a hint key is missing", () => {
    expect(() => pickHintsMessages(teacherRu, ["missing_key"] as const)).toThrow(/Missing message/);
  });

  it("matches en slice for the same keys", () => {
    const keys = ["lesson_type"] as const;
    expect(pickHintsMessages(teacherEn, keys).lesson_type.term).toBe("Lesson type");
    expect(pickHintsMessages(adminEn, ["timezone"] as const).timezone.term).toBe("Time zone");
    expect(pickHintsMessages(analyticsEn, ["year_totals"] as const).year_totals.term).toBe(
      "Totals by year",
    );
  });

  it("covers full catalog key lists per slice", () => {
    expect(Object.keys(pickHintsMessages(teacherRu, TEACHER_HINT_KEYS)).length).toBe(
      TEACHER_HINT_KEYS.length,
    );
    expect(Object.keys(pickHintsMessages(adminRu, ADMIN_HINT_KEYS)).length).toBe(ADMIN_HINT_KEYS.length);
    expect(Object.keys(pickHintsMessages(analyticsRu, ANALYTICS_HINT_KEYS)).length).toBe(
      ANALYTICS_HINT_KEYS.length,
    );
  });
});
