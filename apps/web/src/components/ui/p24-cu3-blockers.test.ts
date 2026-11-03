import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const webSrc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("P24-CU3 blocker regressions", () => {
  it("RosterTable add-pupil submit uses size=field next to FormSelect", () => {
    const source = fs.readFileSync(
      path.join(webSrc, "components/teacher/RosterTable.tsx"),
      "utf8",
    );
    expect(source).toMatch(/type="submit"[\s\S]*size="field"/);
    expect(source).not.toMatch(/type="submit"[\s\S]*min-h-11/);
  });

  it("PupilAchievementPanel outline actions use default h-9 (no min-h-11 on md+)", () => {
    const source = fs.readFileSync(
      path.join(webSrc, "components/achievements/PupilAchievementPanelContent.client.tsx"),
      "utf8",
    );
    expect(source).not.toContain('className="min-h-11"');
  });

  it("GroupYearSummarySection all-years link uses default button height", () => {
    const source = fs.readFileSync(
      path.join(webSrc, "components/analytics/years/GroupYearSummarySection.tsx"),
      "utf8",
    );
    expect(source).not.toContain("min-h-11");
  });
});
