import { describe, expect, it } from "vitest";
import {
  IANA_TIME_ZONE_TRANSLATIONS,
  labelContainsUnexpectedLatin,
  TRANSLATED_IANA_TIME_ZONE_IDS,
} from "@/lib/i18n/timezone-ru-labels";
import { formatIanaTimeZoneOptionLabel } from "@/lib/i18n/format-iana-timezone-option-label";
import { listIanaTimeZoneOptionLabels } from "@/lib/i18n/iana-timezone-options.server";

describe("timezone-ru-labels (D-2)", () => {
  it("defines at least 40 translated IANA zones", () => {
    expect(TRANSLATED_IANA_TIME_ZONE_IDS.length).toBeGreaterThanOrEqual(40);
    expect(Object.keys(IANA_TIME_ZONE_TRANSLATIONS).length).toBeGreaterThanOrEqual(40);
  });

  it("ru picker labels have no latin except UTC", () => {
    const options = listIanaTimeZoneOptionLabels("ru");
    for (const option of options) {
      expect(
        labelContainsUnexpectedLatin(option.label),
        `unexpected latin in ${option.value}: ${option.label}`,
      ).toBe(false);
    }
  });

  it("orphan saved zone uses UTC offset label only", () => {
    const label = formatIanaTimeZoneOptionLabel("Etc/GMT-5", "ru", { orphan: true });
    expect(label).toMatch(/^UTC/);
    expect(labelContainsUnexpectedLatin(label)).toBe(false);
  });
});
