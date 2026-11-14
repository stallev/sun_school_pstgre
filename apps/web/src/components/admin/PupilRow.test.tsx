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

  it("renders no lone hint after «Перевести» in pupil rows (P29)", () => {
    const row = fs.readFileSync(path.join(componentDir, "PupilRow.tsx"), "utf8");
    const actions = fs.readFileSync(path.join(componentDir, "PupilRowActions.client.tsx"), "utf8");
    expect(row).not.toMatch(/pupilTransferHint|TermLabel/);
    expect(actions).not.toMatch(/pupilTransferHint|TermLabel|TermHint/);
    expect(actions).toMatch(/messages\.people\.transferAction/);
  });
});
