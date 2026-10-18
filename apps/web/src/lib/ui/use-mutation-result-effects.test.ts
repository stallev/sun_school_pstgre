import { describe, expect, it } from "vitest";
import { shouldProcessMutationState } from "@/lib/ui/use-mutation-result-effects";

describe("shouldProcessMutationState", () => {
  const ok = { ok: true as const, data: { id: "1" } };
  const okAgain = { ok: true as const, data: { id: "2" } };

  it("skips null state", () => {
    expect(shouldProcessMutationState(null, null)).toBe(false);
    expect(shouldProcessMutationState(ok, null)).toBe(false);
  });

  it("processes first non-null state", () => {
    expect(shouldProcessMutationState(null, ok)).toBe(true);
  });

  it("skips the same state reference", () => {
    expect(shouldProcessMutationState(ok, ok)).toBe(false);
  });

  it("processes a new state object after another action", () => {
    expect(shouldProcessMutationState(ok, okAgain)).toBe(true);
  });
});
