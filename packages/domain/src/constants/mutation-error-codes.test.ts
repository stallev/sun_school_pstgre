import { describe, expect, it } from "vitest";
import { MUTATION_ERROR_CODES, MUTATION_ERROR_CODE_PREFIXES } from "./mutation-error-codes";

const COMMON = [
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION",
  "CONFLICT",
  "RATE_LIMITED",
  "INTERNAL",
];

describe("MUTATION_ERROR_CODES", () => {
  it("keeps key equal to value (no aliasing)", () => {
    for (const [key, value] of Object.entries(MUTATION_ERROR_CODES)) {
      expect(value).toBe(key);
    }
  });

  it("allows only common codes or codes with a contract prefix", () => {
    for (const code of Object.values(MUTATION_ERROR_CODES)) {
      const ok =
        COMMON.includes(code) || MUTATION_ERROR_CODE_PREFIXES.some((prefix) => code.startsWith(prefix));
      expect(ok, code).toBe(true);
    }
  });
});
