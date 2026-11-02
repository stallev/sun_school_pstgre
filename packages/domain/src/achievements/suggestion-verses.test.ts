import { describe, expect, it } from "vitest";
import { buildSuggestionVerseList } from "./suggestion-verses";

describe("buildSuggestionVerseList", () => {
  it("follows evidence order and dedupes by reference", () => {
    const list = buildSuggestionVerseList(
      ["c2", "c1"],
      [
        { checkId: "c1", verses: [{ reference: "Ин 3:16", text: "a" }] },
        {
          checkId: "c2",
          verses: [
            { reference: "Пс 22:1", text: "b" },
            { reference: "Ин 3:16", text: "a" },
          ],
        },
      ],
    );
    expect(list.map((item) => item.reference)).toEqual(["Пс 22:1", "Ин 3:16"]);
  });

  it("returns an empty list when no check has verses", () => {
    expect(buildSuggestionVerseList(["c1"], [])).toEqual([]);
    expect(buildSuggestionVerseList([], [{ checkId: "c1", verses: [{ reference: "x", text: null }] }])).toEqual([]);
  });
});
