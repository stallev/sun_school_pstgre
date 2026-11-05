import { describe, expect, it } from "vitest";

import { filterGuideSections } from "@/lib/guide/filter-guide-sections";
import type { GuideSection } from "@/lib/guide/guide-content-types";

const sections: GuideSection[] = [
  { id: "a", title: "Always", steps: [{ text: "x" }] },
  { id: "b", title: "Achievements", requiresFeature: "achievements", steps: [{ text: "y" }] },
  { id: "c", title: "Families", requiresFeature: "parents", steps: [{ text: "z" }] },
];

describe("filterGuideSections", () => {
  it("drops gated sections when flags are off", () => {
    expect(filterGuideSections(sections, { achievementsEnabled: false, parentsEnabled: true }).map((s) => s.id)).toEqual([
      "a",
      "c",
    ]);
    expect(filterGuideSections(sections, { achievementsEnabled: true, parentsEnabled: false }).map((s) => s.id)).toEqual([
      "a",
      "b",
    ]);
  });
});
