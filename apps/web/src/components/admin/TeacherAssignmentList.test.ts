import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const adminDir = path.dirname(fileURLToPath(import.meta.url));

describe("P14-CU5 TeacherAssignmentList assign row layout", () => {
  it("assign controls share h-10 in one sm+ row (redesign §3.4 /groups/[groupId])", () => {
    const source = fs.readFileSync(path.join(adminDir, "TeacherAssignmentList.tsx"), "utf8");
    const assignBlock =
      source.match(/available\.length > 0[\s\S]*?noTeachersAvailable/)?.[0] ?? "";

    expect(assignBlock).toContain("flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2");
    expect(assignBlock).toMatch(/FormSelect[\s\S]*triggerClassName="min-w-0 flex-1"/);
    expect(assignBlock).toMatch(/Button type="submit" className="h-10/);
    expect(assignBlock).not.toContain("min-h-11");
    expect(assignBlock).not.toContain("sm:items-end");
  });
});
