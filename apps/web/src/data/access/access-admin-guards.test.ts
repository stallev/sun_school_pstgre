import { describe, expect, it } from "vitest";
import { MUTATION_ERROR_CODES } from "@sunschool/domain";
import { assertNotSelfAdmin } from "./access-admin-guards.server";

describe("access admin guards", () => {
  it("forbids self admin operations", () => {
    const result = assertNotSelfAdmin("same-id", "same-id");
    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.ACCESS_SELF_FORBIDDEN,
      message: "admin.users.self_forbidden",
    });
  });

  it("allows acting on another user", () => {
    expect(assertNotSelfAdmin("actor", "target")).toBeNull();
  });
});
