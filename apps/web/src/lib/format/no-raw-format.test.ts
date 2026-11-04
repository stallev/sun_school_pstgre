import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const webSrc = join(import.meta.dirname, "..", "..");

const collectFiles = (dir: string, acc: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "design-lab") continue;
      collectFiles(full, acc);
    } else if (/\.(tsx|ts)$/.test(entry) && !/\.test\.(tsx|ts)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
};

const scanRoots = [
  join(webSrc, "components"),
  join(webSrc, "lib", "analytics"),
];

describe("no raw toFixed in analytics UI (ADR-019 §4 п. 3)", () => {
  it("has no toFixed( in components or lib/analytics", () => {
    const hits: string[] = [];
    for (const root of scanRoots) {
      for (const file of collectFiles(root)) {
        const text = readFileSync(file, "utf8");
        if (text.includes("toFixed(")) {
          hits.push(file.replace(/\\/g, "/"));
        }
      }
    }
    expect(hits).toEqual([]);
  });
});

describe("no raw ISO dates in YearCard render", () => {
  it("YearCard formats bounds with formatDate", () => {
    const source = readFileSync(
      join(webSrc, "components", "admin", "YearCard.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/\{row\.startsOn\}/);
    expect(source).toContain("formatDate(row.startsOn");
  });
});

describe("progress fraction uses «из» / «of», not slash (ADR-019 §4 п. 3)", () => {
  const ruAnalytics = JSON.parse(
    readFileSync(join(webSrc, "lib", "messages", "ru", "analytics.json"), "utf8"),
  ) as {
    tables: { attended_checked_value: string };
    pupil_years: { bricks_ratio: string };
  };
  const enAnalytics = JSON.parse(
    readFileSync(join(webSrc, "lib", "messages", "en", "analytics.json"), "utf8"),
  ) as {
    tables: { attended_checked_value: string };
    pupil_years: { bricks_ratio: string };
  };

  it("analytics message templates omit slash separators", () => {
    expect(ruAnalytics.tables.attended_checked_value).toBe("{attended} из {checked}");
    expect(ruAnalytics.pupil_years.bricks_ratio).toBe("{earned} из {issued}");
    expect(enAnalytics.tables.attended_checked_value).toBe("{attended} of {checked}");
    expect(enAnalytics.pupil_years.bricks_ratio).toBe("{earned} of {issued}");
  });

  it("school analytics and check progress do not render « / » fractions", () => {
    const paths = [
      join(webSrc, "components", "admin", "SchoolAnalyticsTable.tsx"),
      join(webSrc, "components", "analytics", "SchoolGroupCards.tsx"),
      join(webSrc, "components", "teacher", "CheckProgress.tsx"),
    ];
    for (const file of paths) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/\} \/ \{/);
      expect(source).not.toMatch(/\/ \{row\./);
    }
  });
});
