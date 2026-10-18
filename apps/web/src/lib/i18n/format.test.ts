import { describe, expect, it } from "vitest";

import { APP_LOCALE } from "@sunschool/domain";

import { formatDateTime, formatNumber } from "./format";

describe("format", () => {
  it("formats dates with locale and school time zone", () => {
    const iso = "2026-03-15T12:00:00.000Z";
    const ru = formatDateTime(iso, {
      locale: "ru",
      timeZone: "Europe/Moscow",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const en = formatDateTime(iso, {
      locale: APP_LOCALE.EN,
      timeZone: "Europe/Moscow",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    expect(ru).toMatch(/2026/);
    expect(en).toMatch(/2026/);
    expect(ru).not.toBe(en);
  });

  it("formats numbers per UI locale", () => {
    expect(formatNumber(1234.5, "ru", { maximumFractionDigits: 1 })).toMatch(/1/);
    expect(formatNumber(1234.5, "en", { maximumFractionDigits: 1 })).toMatch(/1/);
  });
});
