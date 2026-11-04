import { describe, expect, it } from "vitest";
import { PEOPLE_LIST_FILTER } from "@/data/people/people-list-filters";
import {
  buildPeopleListHref,
  clampPeoplePage,
  parsePeopleListFilter,
  parsePeopleListQuery,
  PEOPLE_PAGE_SIZE,
} from "./parse-people-filter";

describe("parsePeopleListFilter", () => {
  it("defaults to all for unknown values", () => {
    expect(parsePeopleListFilter(undefined)).toBe(PEOPLE_LIST_FILTER.ALL);
    expect(parsePeopleListFilter("nope")).toBe(PEOPLE_LIST_FILTER.ALL);
  });

  it("accepts legacy tab", () => {
    expect(parsePeopleListFilter("legacy")).toBe(PEOPLE_LIST_FILTER.LEGACY);
  });
});

describe("parsePeopleListQuery", () => {
  it("parses q, group and page with zod", () => {
    const groupId = "11111111-1111-4111-8111-111111111111";
    const parsed = parsePeopleListQuery({
      filter: "unassigned",
      group: groupId,
      page: "2",
      q: "  Иван  ",
    });
    expect(parsed.filter).toBe(PEOPLE_LIST_FILTER.UNASSIGNED);
    expect(parsed.groupId).toBe(groupId);
    expect(parsed.page).toBe(2);
    expect(parsed.searchTerm).toBe("Иван");
    expect(parsed.displayQuery).toBe("Иван");
  });

  it("drops invalid group uuid", () => {
    expect(parsePeopleListQuery({ group: "Младшая" }).groupId).toBeUndefined();
  });

  it("drops invalid page", () => {
    expect(parsePeopleListQuery({ page: "0" }).page).toBe(1);
    expect(parsePeopleListQuery({ page: "abc" }).page).toBe(1);
  });
});

describe("clampPeoplePage", () => {
  it("clamps page to last page", () => {
    const total = PEOPLE_PAGE_SIZE * 2 + 3;
    expect(clampPeoplePage(99, total)).toBe(3);
    expect(clampPeoplePage(1, 0)).toBe(1);
  });
});

describe("buildPeopleListHref", () => {
  it("preserves filter, group, page and search", () => {
    const href = buildPeopleListHref({
      filter: PEOPLE_LIST_FILTER.UNASSIGNED,
      groupId: "11111111-1111-4111-8111-111111111111",
      page: 2,
      displayQuery: "Петров",
    });
    expect(href).toContain("filter=unassigned");
    expect(href).toContain("group=11111111");
    expect(href).toContain("page=2");
    expect(href).toContain("q=");
  });
});
