import { describe, expect, it } from "vitest";
import { MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import { canCompensate, canIssue } from "./can-issue";

describe("canIssue (bricks_ledger §6.2, §8)", () => {
  it("allows issue within balance", () => {
    expect(canIssue({ earned: 50, issued: 20, quantity: 30 })).toBeNull();
  });

  it("rejects issue above balance", () => {
    const err = canIssue({ earned: 50, issued: 20, quantity: 31 });
    expect(err?.code).toBe(MUTATION_ERROR_CODES.BRICKS_INSUFFICIENT);
  });

  it.each([0, -1, 1.5])("rejects non-positive or non-integer quantity (%s)", (quantity) => {
    const err = canIssue({ earned: 50, issued: 0, quantity });
    expect(err?.code).toBe(MUTATION_ERROR_CODES.VALIDATION);
  });
});

describe("canCompensate (bricks_ledger §6.3, §8)", () => {
  it("allows compensation up to issued total", () => {
    expect(canCompensate({ issued: 40, quantity: -10, note: "fix" })).toBeNull();
    expect(canCompensate({ issued: 40, quantity: -40, note: "full" })).toBeNull();
  });

  it("rejects compensation exceeding issued", () => {
    const err = canCompensate({ issued: 10, quantity: -11, note: "too much" });
    expect(err?.code).toBe(MUTATION_ERROR_CODES.BRICKS_COMPENSATE_EXCEEDS);
  });

  it("rejects compensation without note", () => {
    const err = canCompensate({ issued: 10, quantity: -1, note: "   " });
    expect(err?.code).toBe(MUTATION_ERROR_CODES.VALIDATION);
    expect(err?.fields?.note).toBe("teacher.bricks.note_required");
  });
});
