import { describe, expect, it } from "vitest";

import adminEn from "@/lib/messages/en/admin.json";
import analyticsEn from "@/lib/messages/en/analytics.json";
import teacherEn from "@/lib/messages/en/teacher.json";
import { ADMIN_HINT_KEYS } from "@/lib/messages/admin-hints-types";
import { ANALYTICS_HINT_KEYS } from "@/lib/messages/analytics-hints-types";
import adminRu from "@/lib/messages/ru/admin.json";
import analyticsRu from "@/lib/messages/ru/analytics.json";
import teacherRu from "@/lib/messages/ru/teacher.json";
import { TEACHER_HINT_KEYS } from "@/lib/messages/teacher-hints-types";

const HINT_MAX_LENGTH = 200;

type HintSlice = Record<string, { term: string; hint: string }>;

const readHints = (dictionary: { hints?: HintSlice }): HintSlice =>
  (dictionary.hints ?? {}) as HintSlice;

const assertHintShape = (sliceName: string, hints: HintSlice, locale: string) => {
  for (const [key, entry] of Object.entries(hints)) {
    expect(entry.term.length, `${sliceName}.${key}.term (${locale})`).toBeGreaterThan(0);
    expect(entry.hint.length, `${sliceName}.${key}.hint (${locale})`).toBeGreaterThan(0);
    expect(entry.hint.length, `${sliceName}.${key}.hint (${locale})`).toBeLessThanOrEqual(
      HINT_MAX_LENGTH,
    );
  }
};

const assertNoDuplicateTerms = (
  sliceName: string,
  hints: HintSlice,
  allowed: ReadonlyMap<string, string>,
) => {
  const termToKeys = new Map<string, string[]>();
  for (const [key, entry] of Object.entries(hints)) {
    const list = termToKeys.get(entry.term) ?? [];
    list.push(key);
    termToKeys.set(entry.term, list);
  }
  for (const [term, keys] of termToKeys) {
    if (keys.length <= 1) continue;
    const reason = allowed.get(term);
    expect(reason, `${sliceName}: duplicate term «${term}» in ${keys.join(", ")}`).toBeTruthy();
  }
};

/** P27 phase catalog — priority A (ADR-020, phase description § Каталог). */
export const CATALOG_PRIORITY_A_KEYS = {
  teacher: [
    "regular_attendance",
    "attendance_rate",
    "average_score",
    "checked_state",
    "lesson_type",
    "score_threshold",
    "verse_scale",
    "check_status",
    "bricks_collected",
    "bricks_issued",
    "bricks_left",
    "bricks_issue",
  ],
  analytics: ["record_without_mark", "low_score", "not_in_average", "year_totals"],
  admin: [
    "audit_system",
    "audit_entity_type",
    "consent_migrated",
    "consent_paper",
    "pupil_transfer",
    "approval_roles",
    "approval_groups",
    "user_statuses",
    "deletion_delete",
    "deletion_anonymize",
    "deletion_actions",
    "family_login",
    "year_close",
    "timezone",
    "link_logins",
    "ach_cumulative",
    "ach_series",
    "ach_recalc",
  ],
} as const;

const TEACHER_TERM_DUP_EXCEPTIONS = new Map<string, string>();
const ADMIN_TERM_DUP_EXCEPTIONS = new Map<string, string>();
const ANALYTICS_TERM_DUP_EXCEPTIONS = new Map<string, string>();

describe("hints dictionary parity (P27 CU2)", () => {
  it("teacher ru/en share the same hint keys", () => {
    expect(Object.keys(readHints(teacherRu)).sort()).toEqual(Object.keys(readHints(teacherEn)).sort());
    expect(Object.keys(readHints(teacherRu)).sort()).toEqual([...TEACHER_HINT_KEYS].sort());
  });

  it("admin ru/en share the same hint keys", () => {
    expect(Object.keys(readHints(adminRu)).sort()).toEqual(Object.keys(readHints(adminEn)).sort());
    expect(Object.keys(readHints(adminRu)).sort()).toEqual([...ADMIN_HINT_KEYS].sort());
  });

  it("analytics ru/en share the same hint keys", () => {
    expect(Object.keys(readHints(analyticsRu)).sort()).toEqual(
      Object.keys(readHints(analyticsEn)).sort(),
    );
    expect(Object.keys(readHints(analyticsRu)).sort()).toEqual([...ANALYTICS_HINT_KEYS].sort());
  });

  it("validates hint length and non-empty terms", () => {
    assertHintShape("teacher", readHints(teacherRu), "ru");
    assertHintShape("teacher", readHints(teacherEn), "en");
    assertHintShape("admin", readHints(adminRu), "ru");
    assertHintShape("admin", readHints(adminEn), "en");
    assertHintShape("analytics", readHints(analyticsRu), "ru");
    assertHintShape("analytics", readHints(analyticsEn), "en");
  });

  it("avoids duplicate visible terms within a slice unless documented", () => {
    assertNoDuplicateTerms("teacher", readHints(teacherRu), TEACHER_TERM_DUP_EXCEPTIONS);
    assertNoDuplicateTerms("admin", readHints(adminRu), ADMIN_TERM_DUP_EXCEPTIONS);
    assertNoDuplicateTerms("analytics", readHints(analyticsRu), ANALYTICS_TERM_DUP_EXCEPTIONS);
  });

  it("includes every priority-A catalog key", () => {
    for (const key of CATALOG_PRIORITY_A_KEYS.teacher) {
      expect(readHints(teacherRu)[key]?.term, key).toBeTruthy();
      expect(readHints(teacherEn)[key]?.term, key).toBeTruthy();
    }
    for (const key of CATALOG_PRIORITY_A_KEYS.analytics) {
      expect(readHints(analyticsRu)[key]?.term, key).toBeTruthy();
      expect(readHints(analyticsEn)[key]?.term, key).toBeTruthy();
    }
    for (const key of CATALOG_PRIORITY_A_KEYS.admin) {
      expect(readHints(adminRu)[key]?.term, key).toBeTruthy();
      expect(readHints(adminEn)[key]?.term, key).toBeTruthy();
    }
  });
});
