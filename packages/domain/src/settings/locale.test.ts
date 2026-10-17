import { describe, expect, it } from "vitest";
import { isValidUiMessageLocale, UI_MESSAGE_LOCALES } from "./locale";

describe("isValidUiMessageLocale (ADR-008 §4.1)", () => {
  it("lists ru and en", () => {
    expect(UI_MESSAGE_LOCALES).toEqual(["ru", "en"]);
  });

  it("validates supported locales", () => {
    expect(isValidUiMessageLocale("ru")).toBe(true);
    expect(isValidUiMessageLocale("en")).toBe(true);
    expect(isValidUiMessageLocale("de")).toBe(false);
  });
});
