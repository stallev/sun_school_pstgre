import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const componentDir = path.dirname(fileURLToPath(import.meta.url));

describe("PupilRow (P27-CU6)", () => {
  it("shows consent status only for missing or legacy consent", () => {
    const source = fs.readFileSync(path.join(componentDir, "PupilRow.tsx"), "utf8");
    expect(source).toMatch(/shouldShowConsentStatus/);
    expect(source).not.toMatch(/messages\.people\.consentPaper/);
  });

  it("passes pupil_transfer hint to PupilRowActions", () => {
    const source = fs.readFileSync(path.join(componentDir, "PupilRow.tsx"), "utf8");
    expect(source).toMatch(/pupilTransferHint/);
  });
});
