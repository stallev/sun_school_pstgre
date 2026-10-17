import { describe, expect, it } from "vitest";
import { ACCOUNT_STATUS, USER_ROLE } from "@sunschool/domain";
import { homeRouteFor } from "@sunschool/policy-edge";

/** P02-T14 / W8-03: end state after approve + optional assign (manual smoke step 4). */
describe("P02 P01 follow-up: teacher approval regression", () => {
  it("routes ACTIVE TEACHER to /today after approval path", () => {
    expect(homeRouteFor(ACCOUNT_STATUS.ACTIVE, [USER_ROLE.TEACHER])).toBe("/today");
  });
});
