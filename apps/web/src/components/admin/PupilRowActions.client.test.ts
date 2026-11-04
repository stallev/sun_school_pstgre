import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const adminDir = path.dirname(fileURLToPath(import.meta.url));

describe("PupilRowActions (P27-CU6)", () => {
  it("transfer action uses TermLabel with pupil_transfer hint", () => {
    const source = fs.readFileSync(path.join(adminDir, "PupilRowActions.client.tsx"), "utf8");
    expect(source).toMatch(/pupilTransferHint/);
    expect(source).toMatch(/TermLabel[\s\S]*pupilTransferHint\.term/);
    expect(source).not.toMatch(/primaryButton\(messages\.people\.transferAction/);
  });
});
