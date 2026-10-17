import { describe, expect, it } from "vitest";
import { parseCompensateBricksInput, parseIssueBricksInput } from "./schemas";

const pupilId = "11111111-1111-4111-8111-111111111111";
const yearId = "22222222-2222-4222-8222-222222222222";

describe("issueBricksInputSchema (bricks_ledger §5, §8 N)", () => {
  it("accepts valid issue payload", () => {
    const result = parseIssueBricksInput(
      { pupilId, yearId, quantity: 3, issuedOn: "2026-10-10" },
      "2026-10-17",
    );
    expect(result.success).toBe(true);
  });

  it("rejects zero and fractional quantity", () => {
    expect(parseIssueBricksInput({ pupilId, yearId, quantity: 0 }, "2026-10-17").success).toBe(
      false,
    );
    expect(parseIssueBricksInput({ pupilId, yearId, quantity: 1.5 }, "2026-10-17").success).toBe(
      false,
    );
  });

  it("rejects future issuedOn", () => {
    const result = parseIssueBricksInput(
      { pupilId, yearId, quantity: 1, issuedOn: "2026-10-18" },
      "2026-10-17",
    );
    expect(result.success).toBe(false);
  });
});

describe("compensateBricksInputSchema (bricks_ledger §5, §8 N)", () => {
  it("rejects compensation without note", () => {
    const result = parseCompensateBricksInput(
      { pupilId, yearId, quantity: -2, note: "" },
      "2026-10-17",
    );
    expect(result.success).toBe(false);
  });

  it("accepts negative quantity with note", () => {
    const result = parseCompensateBricksInput(
      { pupilId, yearId, quantity: -2, note: "ошибка" },
      "2026-10-17",
    );
    expect(result.success).toBe(true);
  });
});
