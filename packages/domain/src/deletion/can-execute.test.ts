import { describe, expect, it } from "vitest";
import { DELETION_REQUEST_STATUS } from "../constants/enums";
import { MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import { canExecute } from "./can-execute";

const base = {
  requestStatus: DELETION_REQUEST_STATUS.IN_PROGRESS,
  subjectIsSoleAdmin: false,
  requestedByUserId: "user-a",
  executorUserId: "user-b",
  otherAdminExists: true,
};

describe("canExecute (deletion_requests §8, УД-9)", () => {
  it("allows execution when guards pass", () => {
    expect(canExecute(base)).toBeNull();
  });

  it("rejects when status is not IN_PROGRESS", () => {
    const err = canExecute({ ...base, requestStatus: DELETION_REQUEST_STATUS.NEW });
    expect(err?.code).toBe(MUTATION_ERROR_CODES.DELETION_STATUS_INVALID);
  });

  it("rejects when subject is the sole admin", () => {
    const err = canExecute({ ...base, subjectIsSoleAdmin: true });
    expect(err?.code).toBe(MUTATION_ERROR_CODES.DELETION_LAST_ADMIN);
  });

  it("rejects self-execution when another admin exists", () => {
    const err = canExecute({
      ...base,
      executorUserId: "user-a",
      requestedByUserId: "user-a",
      otherAdminExists: true,
    });
    expect(err?.code).toBe(MUTATION_ERROR_CODES.DELETION_SELF_EXECUTE);
  });

  it("allows sole admin to execute their own request when no other admin exists", () => {
    expect(
      canExecute({
        ...base,
        executorUserId: "user-a",
        requestedByUserId: "user-a",
        otherAdminExists: false,
      }),
    ).toBeNull();
  });
});
