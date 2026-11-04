import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const achievementsDir = path.dirname(fileURLToPath(import.meta.url));

describe("TodayAchievementMarkSection (P26-CU6)", () => {
  it("links admin enable-in-settings CTA to admin group detail, not teacher /group", () => {
    const source = fs.readFileSync(
      path.join(achievementsDir, "TodayAchievementMarkSection.server.tsx"),
      "utf8",
    );
    expect(source).toMatch(/href=\{`\/groups\/\$\{gradeId\}`\}/);
    expect(source).not.toMatch(/href="\/group"/);
  });
});
