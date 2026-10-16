import { describe, expect, it, vi } from "vitest";
import { MUTATION_ERROR_CODES } from "@sunschool/domain";
import { submitRegistration } from "./submit-registration";

describe("submitRegistration validation", () => {
  it("rejects missing consent before opening a transaction", async () => {
    const db = { $transaction: vi.fn() };
    const result = await submitRegistration(
      db as never,
      "user-1",
      { lastName: "Иванов", firstName: "Пётр", consentAccepted: false },
      new Date(),
    );
    expect(result).toMatchObject({
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      fields: { consentAccepted: "auth.register.consent_required" },
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("rejects invalid name characters", async () => {
    const db = { $transaction: vi.fn() };
    const result = await submitRegistration(
      db as never,
      "user-1",
      { lastName: "123", firstName: "Пётр", consentAccepted: true },
      new Date(),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe(MUTATION_ERROR_CODES.VALIDATION);
      expect(result.fields?.lastName).toBe("auth.register.err_chars");
    }
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
