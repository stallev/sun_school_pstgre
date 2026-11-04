import { describe, expect, it } from "vitest";
import { normalizeVerseText } from "@/data/bible/normalize-verse-text";

describe("normalizeVerseText (P27-CU8)", () => {
  it("replaces ASCII double hyphen with em dash (D-20)", () => {
    expect(normalizeVerseText("word--word")).toBe("word\u2014word");
  });

  it("leaves text without double hyphen unchanged", () => {
    expect(normalizeVerseText("\u0443\u0436\u0435 \u2014 \u0442\u0438\u0440\u0435")).toBe(
      "\u0443\u0436\u0435 \u2014 \u0442\u0438\u0440\u0435",
    );
  });
});
