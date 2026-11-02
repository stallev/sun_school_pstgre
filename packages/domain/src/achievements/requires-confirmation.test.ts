import { describe, expect, it } from "vitest";
import { MIN_LESSONS_FOR_CONFIRMATION } from "./constants";
import { requiresConfirmation } from "./requires-confirmation";

describe("requiresConfirmation", () => {
  it("uses the documented threshold", () => {
    expect(MIN_LESSONS_FOR_CONFIRMATION).toBe(2);
  });

  it("is false when the flag is off, whatever the length", () => {
    expect(requiresConfirmation({ requiresConfirmation: false }, 3)).toBe(false);
  });

  it("is false for a series of length 1", () => {
    expect(requiresConfirmation({ requiresConfirmation: true }, 1)).toBe(false);
  });

  it("is true from length 2 when the flag is on", () => {
    expect(requiresConfirmation({ requiresConfirmation: true }, 2)).toBe(true);
    expect(requiresConfirmation({ requiresConfirmation: true }, 3)).toBe(true);
  });
});
