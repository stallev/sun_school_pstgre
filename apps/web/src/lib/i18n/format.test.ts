import { describe, expect, it } from "vitest";

import { APP_LOCALE } from "@sunschool/domain";

import ruAnalytics from "@/lib/messages/ru/analytics.json";
import { formatDateTime, formatNumber, getPluralForms, plural } from "./format";

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

  it("pluralizes school attention pending users (ru)", () => {
    const forms = getPluralForms(ruAnalytics, "school.attention_pending_users");
    expect(plural(forms, 1, "ru")).toBe("1 пользователь ждёт роль");
    expect(plural(forms, 2, "ru")).toBe("2 пользователя ждут роль");
    expect(plural(forms, 5, "ru")).toBe("5 пользователей ждут роль");
    expect(plural(forms, 11, "ru")).toBe("11 пользователей ждут роль");
    expect(plural(forms, 21, "ru")).toBe("21 пользователь ждёт роль");
  });
});
