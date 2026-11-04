import { describe, expect, it } from "vitest";
import { formatIanaTimeZoneOptionLabel } from "@/lib/i18n/format-iana-timezone-option-label";

describe("formatIanaTimeZoneOptionLabel", () => {
  it("formats Moscow with UTC offset for ru locale", () => {
    const label = formatIanaTimeZoneOptionLabel("Europe/Moscow", "ru");
    expect(label).toMatch(/^Москва \(UTC/);
  });

  it("formats Moscow for en locale", () => {
    const label = formatIanaTimeZoneOptionLabel("Europe/Moscow", "en");
    expect(label.startsWith("Moscow (UTC")).toBe(true);
  });
});
