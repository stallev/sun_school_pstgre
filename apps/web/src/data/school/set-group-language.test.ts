import { describe, expect, it, vi } from "vitest";
import { APP_LOCALE, MUTATION_ERROR_CODES } from "@sunschool/domain";
import { setGroupLanguage } from "./set-group-language";

const gradeId = "11111111-1111-4111-8111-111111111111";
const orgId = "22222222-2222-4222-8222-222222222222";
const actorUserId = "33333333-3333-4333-8333-333333333333";

describe("setGroupLanguage", () => {
  it("returns SCHOOL_LANGUAGE_UNAVAILABLE when EN is not READY", async () => {
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
      },
      grade: {
        findFirst: vi.fn().mockResolvedValue({
          id: gradeId,
          name: "G1",
          isActive: true,
          language: APP_LOCALE.RU,
        }),
        update: vi.fn(),
      },
      bibleTranslation: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await setGroupLanguage(db as never, actorUserId, {
      gradeId,
      language: APP_LOCALE.EN,
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.SCHOOL_LANGUAGE_UNAVAILABLE,
      message: "admin.group.language_unavailable",
    });
    expect(tx.grade.update).not.toHaveBeenCalled();
  });
});
