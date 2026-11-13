import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const adminDir = path.dirname(fileURLToPath(import.meta.url));

describe("PupilRowActions (P29-CU6)", () => {
  it("transfer button is a plain label without a hint icon inside the button", () => {
    const source = fs.readFileSync(path.join(adminDir, "PupilRowActions.client.tsx"), "utf8");
    expect(source).not.toMatch(/TermLabel|TermHint|pupilTransferHint/);
    expect(source).toMatch(/const transferLabel = messages\.people\.transferAction/);
  });
});
