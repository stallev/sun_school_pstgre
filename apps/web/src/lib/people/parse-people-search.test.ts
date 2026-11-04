import { describe, expect, it } from "vitest";
import {
  PEOPLE_SEARCH_MIN_LENGTH,
  appendPeopleSearchToHref,
  parsePeopleSearchParam,
  sanitizePeopleSearchTerm,
} from "@/lib/people/parse-people-search";

describe("parsePeopleSearchParam", () => {
  it("ignores queries shorter than two characters", () => {
    expect(parsePeopleSearchParam("")).toEqual({ searchTerm: undefined, displayQuery: "" });
    expect(parsePeopleSearchParam("  а ")).toEqual({ searchTerm: undefined, displayQuery: "а" });
  });

  it("accepts case-preserved terms with length ≥ 2", () => {
    expect(parsePeopleSearchParam("Иванов")).toEqual({
      searchTerm: "Иванов",
      displayQuery: "Иванов",
    });
  });

  it("sanitizes control characters and collapses whitespace", () => {
    const raw = "Ива\u0000нов  Петр";
    expect(parsePeopleSearchParam(raw)).toEqual({
      searchTerm: "Иванов Петр",
      displayQuery: raw.trim(),
    });
  });

  it("clears display query when raw exceeds max length", () => {
    const tooLong = "а".repeat(PEOPLE_SEARCH_MIN_LENGTH + 100);
    expect(parsePeopleSearchParam(tooLong).displayQuery).toBe("");
    expect(parsePeopleSearchParam(tooLong).searchTerm).toBeUndefined();
  });
});

describe("sanitizePeopleSearchTerm", () => {
  it("removes null bytes", () => {
    expect(sanitizePeopleSearchTerm("a\u0000b")).toBe("ab");
  });
});

describe("appendPeopleSearchToHref", () => {
  it("preserves filter param and adds q", () => {
    expect(appendPeopleSearchToHref("/people?filter=unassigned", "Иванов")).toBe(
      "/people?filter=unassigned&q=%D0%98%D0%B2%D0%B0%D0%BD%D0%BE%D0%B2",
    );
  });

  it("skips q when term is too short", () => {
    expect(appendPeopleSearchToHref("/people", "и")).toBe("/people");
  });
});
