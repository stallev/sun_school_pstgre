import { describe, expect, it } from "vitest";
import { formatGroupListMeta } from "@/lib/admin/format-group-list-meta";

describe("formatGroupListMeta", () => {
  it("joins language, age and teacher count", () => {
    expect(
      formatGroupListMeta({
        languageLabel: "Русский",
        ageMin: 6,
        ageMax: 8,
        teacherLabel: "1 учитель",
        ageRangeTemplate: "{range} лет",
      }),
    ).toBe("Русский · 6–8 лет · 1 учитель");
  });
});
