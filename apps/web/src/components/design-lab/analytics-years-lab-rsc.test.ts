import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const designLabDir = join(import.meta.dirname);

describe("AnalyticsYearsLab RSC props", () => {
  it("passes serializable dictionary, not picked messages with functions", () => {
    const labSource = readFileSync(join(designLabDir, "AnalyticsYearsLab.tsx"), "utf8");
    const matrixSource = readFileSync(
      join(designLabDir, "AnalyticsYearsMatrix.client.tsx"),
      "utf8",
    );

    expect(labSource).toMatch(/analyticsDictionary=\{analyticsDictionary\}/);
    expect(labSource).not.toMatch(/pickAnalyticsMessages/);
    expect(matrixSource).toMatch(/pickAnalyticsMessages\(analyticsDictionary\)/);
  });
});
