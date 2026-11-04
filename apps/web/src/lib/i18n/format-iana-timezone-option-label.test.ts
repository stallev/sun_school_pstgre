import { describe, expect, it } from "vitest";
import { formatIanaTimeZoneOptionLabel, disambiguateIanaTimeZoneOptionLabels } from "@/lib/i18n/format-iana-timezone-option-label";

describe("formatIanaTimeZoneOptionLabel", () => {
  it("formats Moscow with city, region and UTC offset for ru locale", () => {
    const label = formatIanaTimeZoneOptionLabel("Europe/Moscow", "ru");
    expect(label).toMatch(/^Москва, Россия \(UTC/);
  });

  it("formats Moscow for en locale", () => {
    const label = formatIanaTimeZoneOptionLabel("Europe/Moscow", "en");
    expect(label.startsWith("Moscow, Russia (UTC")).toBe(true);
  });
});

describe("disambiguateIanaTimeZoneOptionLabels", () => {
  it("appends zone suffix when labels collide", () => {
    const result = disambiguateIanaTimeZoneOptionLabels([
      { value: "Europe/Moscow", label: "Москва (UTC+3)" },
      { value: "Europe/Simferopol", label: "Москва (UTC+3)" },
    ]);
    expect(result[0]?.label).toContain("·");
    expect(result[1]?.label).toContain("·");
  });
});
