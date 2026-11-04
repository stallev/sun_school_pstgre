import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const messagesRoot = path.join(import.meta.dirname, ".");

const collectStringValues = (value: unknown, out: string[]): void => {
  if (typeof value === "string") {
    out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectStringValues(entry, out));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((entry) => collectStringValues(entry, out));
  }
};

const loadLocaleValues = (locale: "ru" | "en"): string[] => {
  const dir = path.join(messagesRoot, locale);
  const values: string[] = [];
  for (const file of readdirSync(dir).filter((name) => name.endsWith(".json"))) {
    const parsed = JSON.parse(readFileSync(path.join(dir, file), "utf8")) as unknown;
    collectStringValues(parsed, values);
  }
  return values;
};

const RU_FORBIDDEN = ["выборка", "N=", "п. п.", "IANA", "ADR", "LEGACY", "DTO"] as const;
const EN_FORBIDDEN = ["sample", "N=", "IANA", "ADR"] as const;

const RU_EXCEPTIONS: { pattern: string; reason: string }[] = [];
const EN_EXCEPTIONS: { pattern: string; reason: string }[] = [];

const findForbidden = (
  values: string[],
  patterns: readonly string[],
  exceptions: { pattern: string; reason: string }[],
): string[] => {
  const allowed = new Set(exceptions.map((entry) => entry.pattern));
  const hits: string[] = [];
  for (const text of values) {
    for (const pattern of patterns) {
      if (allowed.has(pattern)) continue;
      if (text.includes(pattern)) {
        hits.push(`${pattern} → ${text}`);
      }
    }
  }
  return hits;
};

describe("forbidden user-facing dictionary terms (ADR-018 §4.5)", () => {
  it("has documented exceptions for ru", () => {
    expect(RU_EXCEPTIONS.every((entry) => entry.reason.length > 0)).toBe(true);
  });

  it("has documented exceptions for en", () => {
    expect(EN_EXCEPTIONS.every((entry) => entry.reason.length > 0)).toBe(true);
  });

  it("ru/*.json values avoid analyst stop-words", () => {
    expect(findForbidden(loadLocaleValues("ru"), RU_FORBIDDEN, RU_EXCEPTIONS)).toEqual([]);
  });

  it("en/*.json values avoid analyst stop-words", () => {
    expect(findForbidden(loadLocaleValues("en"), EN_FORBIDDEN, EN_EXCEPTIONS)).toEqual([]);
  });
});
