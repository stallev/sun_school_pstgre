import { describe, expect, it } from "vitest";
import { isValidIanaTimeZone } from "./timezone";

describe("isValidIanaTimeZone (ADR-004 §4.8)", () => {
  it("accepts a known IANA zone", () => {
    const zones = Intl.supportedValuesOf("timeZone");
    expect(zones.length).toBeGreaterThan(0);
    expect(isValidIanaTimeZone(zones[0]!)).toBe(true);
    expect(isValidIanaTimeZone("Europe/Moscow")).toBe(
      Intl.supportedValuesOf("timeZone").includes("Europe/Moscow"),
    );
  });

  it("rejects unknown or empty values", () => {
    expect(isValidIanaTimeZone("Not/A_Zone")).toBe(false);
    expect(isValidIanaTimeZone("")).toBe(false);
    expect(isValidIanaTimeZone("   ")).toBe(false);
  });
});
