import { describe, expect, expectTypeOf, it } from "vitest";
import { MUTATION_ERROR_CODES, MUTATION_WARNING_CODES } from "../constants/mutation-error-codes";
import type { MutationErr, MutationResult } from "./mutation-result";

describe("MutationResult", () => {
  it("carries data on success and fields on validation errors", () => {
    const ok: MutationResult<{ id: string }> = { ok: true, data: { id: "u1" } };
    const err: MutationResult = {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      fields: { lastName: "auth.register.err_name" },
    };
    expect(ok.ok).toBe(true);
    expect(err.ok).toBe(false);
    expectTypeOf<MutationErr["fields"]>().toEqualTypeOf<Record<string, string> | undefined>();
  });

  it("allows warnings only from the registry", () => {
    const ok: MutationResult = { ok: true, warnings: [MUTATION_WARNING_CODES.NO_GROUPS] };
    expect(ok.ok && ok.warnings).toEqual(["NO_GROUPS"]);
    // @ts-expect-error unknown warning codes are rejected
    const bad: MutationResult = { ok: true, warnings: ["SOMETHING_ELSE"] };
    expect(bad.ok).toBe(true);
  });

  it("rejects error codes outside the registry", () => {
    // @ts-expect-error not a registered code
    const bad: MutationResult = { ok: false, code: "MADE_UP" };
    expect(bad.ok).toBe(false);
  });

  it("registers the ACCESS_ codes of the contract", () => {
    expect(Object.keys(MUTATION_ERROR_CODES)).toEqual(
      expect.arrayContaining([
        "ACCESS_STATUS_INVALID",
        "ACCESS_ALREADY_PENDING",
        "ACCESS_REQUEST_DECIDED",
        "ACCESS_ROLE_UNAVAILABLE",
        "ACCESS_LAST_ADMIN",
        "ACCESS_SELF_FORBIDDEN",
      ]),
    );
  });
});
