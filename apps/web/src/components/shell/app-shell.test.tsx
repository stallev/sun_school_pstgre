import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { shellGridClassName, shellViewContainerClassName } from "@/lib/shell/shell-layout-classes";

const appShellSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "app-shell.tsx"),
  "utf8",
);

describe("shellGridClassName", () => {
  it("uses 16rem column when expanded", () => {
    expect(shellGridClassName(false)).toContain("lg:grid-cols-[16rem_minmax(0,1fr)]");
  });

  it("uses 4rem rail column when collapsed", () => {
    expect(shellGridClassName(true)).toContain("lg:grid-cols-[4rem_minmax(0,1fr)]");
  });

  it("includes motion-reduce transition guard", () => {
    expect(shellGridClassName(false)).toContain("motion-reduce:transition-none");
  });

  it("centers the sidebar grid with the header shell box", () => {
    expect(shellGridClassName(false)).toContain("max-w-[1600px]");
    expect(shellGridClassName(false)).toContain("mx-auto");
  });
});

describe("AppShell #view container", () => {
  it("centers page content with the shared shell view container", () => {
    expect(appShellSource).toContain('id="view"');
    expect(appShellSource).toContain("shellViewContainerClassName");
    expect(shellViewContainerClassName).toMatch(/max-w-\[1600px\]/);
  });
});
