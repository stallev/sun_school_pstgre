import { describe, expect, it } from "vitest";
import { canActOnSuggestions } from "@/lib/achievements/can-act-on-suggestions";

describe("canActOnSuggestions", () => {
  it("allows teacher and admin in an active year regardless of group mode", () => {
    expect(canActOnSuggestions(false, false)).toBe(true);
    expect(canActOnSuggestions(false, true)).toBe(true);
  });

  it("allows only admin in a closed year", () => {
    expect(canActOnSuggestions(true, false)).toBe(false);
    expect(canActOnSuggestions(true, true)).toBe(true);
  });
});
