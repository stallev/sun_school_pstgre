import { describe, expect, it } from "vitest";
import { buildGuideTocGroups } from "@/lib/guide/build-guide-toc-groups";
import type { GuideSection } from "@/lib/guide/guide-content-types";

const section = (id: string): GuideSection => ({ id, title: id, steps: [] });

describe("buildGuideTocGroups", () => {
  it("returns one untitled group without tocGroups", () => {
    expect(buildGuideTocGroups([section("a"), section("b")], undefined)).toEqual([
      { sections: [section("a"), section("b")] },
    ]);
  });

  it("groups by ids, hides empty groups and appends ungrouped sections", () => {
    const groups = buildGuideTocGroups(
      [section("a"), section("b"), section("c")],
      [
        { title: "One", ids: ["a", "missing"] },
        { title: "Empty", ids: ["gone"] },
      ],
    );
    expect(groups).toEqual([
      { title: "One", sections: [section("a")] },
      { sections: [section("b"), section("c")] },
    ]);
  });

  it("returns no groups when there are no sections", () => {
    expect(buildGuideTocGroups([], undefined)).toEqual([]);
  });
});
