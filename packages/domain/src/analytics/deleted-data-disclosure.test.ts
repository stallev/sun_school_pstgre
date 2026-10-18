import { describe, expect, it } from "vitest";
import {
  ANALYTICS_DELETED_CHILDREN_DISCLOSURE_MIN,
  shouldDiscloseDeletedChildCount,
  shouldShowDeletedDataNote,
} from "./deleted-data-disclosure";

describe("deleted-data disclosure (analytics §9.1)", () => {
  it("hides note when no deletions in period", () => {
    expect(shouldShowDeletedDataNote(0)).toBe(false);
  });

  it("shows note for one or more deletions", () => {
    expect(shouldShowDeletedDataNote(1)).toBe(true);
    expect(shouldShowDeletedDataNote(2)).toBe(true);
  });

  it(`does not disclose child count below ${ANALYTICS_DELETED_CHILDREN_DISCLOSURE_MIN}`, () => {
    expect(shouldDiscloseDeletedChildCount(0)).toBe(false);
    expect(shouldDiscloseDeletedChildCount(1)).toBe(false);
    expect(shouldDiscloseDeletedChildCount(2)).toBe(false);
  });

  it(`discloses child count at ${ANALYTICS_DELETED_CHILDREN_DISCLOSURE_MIN} or more`, () => {
    expect(shouldDiscloseDeletedChildCount(3)).toBe(true);
    expect(shouldDiscloseDeletedChildCount(5)).toBe(true);
  });
});
