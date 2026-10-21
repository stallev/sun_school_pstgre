import { describe, expect, it } from "vitest";

import { APP_LOCALE } from "@sunschool/domain";

import { assertSerializableMessages } from "@/lib/messages/assert-serializable-messages";
import commonRu from "@/lib/messages/ru/common.json";
import teacherRu from "@/lib/messages/ru/teacher.json";
import { pickTeacherBricksMessages } from "@/lib/messages/pick-teacher-bricks-messages.server";
import { pickTeacherCalendarMessages } from "@/lib/messages/pick-teacher-calendar-messages.server";
import { pickTeacherCheckMessages } from "@/lib/messages/pick-teacher-check-messages.server";
import { pickTeacherLessonFormMessages } from "@/lib/messages/pick-teacher-lesson-messages.server";
import { pickTeacherRosterMessages } from "@/lib/messages/pick-teacher-roster-messages.server";

describe("teacher client message picks", () => {
  it("returns slices without function values for CU1 routes", () => {
    const teacher = teacherRu;
    const common = commonRu;

    const slices = [
      pickTeacherLessonFormMessages(teacher, APP_LOCALE.RU),
      pickTeacherCheckMessages(teacher, common),
      pickTeacherRosterMessages(teacher),
      pickTeacherBricksMessages(teacher),
      pickTeacherCalendarMessages(teacher, APP_LOCALE.RU),
    ];

    for (const slice of slices) {
      expect(() => assertSerializableMessages(slice)).not.toThrow();
    }
  });
});
