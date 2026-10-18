import { describe, expect, it } from "vitest";

import { formatPlural, getPluralCategory, getPluralForms } from "./plural";
import { getDictionary } from "./get-dictionary";

describe("plural", () => {
  it("selects Russian lesson forms for 1 / 2 / 5", () => {
    expect(getPluralCategory(1, "ru")).toBe("one");
    expect(getPluralCategory(2, "ru")).toBe("few");
    expect(getPluralCategory(5, "ru")).toBe("many");
  });

  it("formats lessons_count from the common dictionary", async () => {
    const ru = await getDictionary("ru", "common");
    const forms = getPluralForms(ru, "plural.lessons_count");
    expect(formatPlural(forms, 1, "ru")).toBe("1 урок");
    expect(formatPlural(forms, 2, "ru")).toBe("2 урока");
    expect(formatPlural(forms, 5, "ru")).toBe("5 уроков");
  });

  it("formats English lessons_count", async () => {
    const en = await getDictionary("en", "common");
    const forms = getPluralForms(en, "plural.lessons_count");
    expect(formatPlural(forms, 1, "en")).toBe("1 lesson");
    expect(formatPlural(forms, 5, "en")).toBe("5 lessons");
  });
});
