import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const teacherDir = path.dirname(fileURLToPath(import.meta.url));

describe("CheckCard present/singing layout (§5.2 P24-CU2)", () => {
  it("stacks present and singing with divide-line on mobile; hint under presence", () => {
    const source = fs.readFileSync(path.join(teacherDir, "CheckCard.tsx"), "utf8");
    expect(source).toMatch(
      /flex flex-col divide-y divide-line lg:flex-row lg:flex-wrap lg:divide-y-0/,
    );
    expect(source).toMatch(/space-y-1 lg:hidden[\s\S]*presentHint/);
    expect(source).toMatch(/hidden space-y-1 lg:block lg:basis-full[\s\S]*presentHint/);
  });
});
