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
  it("uses 16rem column on every width ≥ lg when the user chose expanded", () => {
    const classes = shellGridClassName("expanded");
    expect(classes).toContain("lg:grid-cols-[16rem_minmax(0,1fr)]");
    expect(classes).not.toContain("xl:grid-cols");
  });

  it("uses 4rem rail column when the user chose collapsed", () => {
    const classes = shellGridClassName("collapsed");
    expect(classes).toContain("lg:grid-cols-[4rem_minmax(0,1fr)]");
    expect(classes).not.toContain("xl:grid-cols");
  });

  it("defaults to rail on lg and expanded from xl without a saved choice", () => {
    const classes = shellGridClassName("auto");
    expect(classes).toContain("lg:grid-cols-[4rem_minmax(0,1fr)]");
    expect(classes).toContain("xl:grid-cols-[16rem_minmax(0,1fr)]");
  });

  it("includes motion-reduce transition guard", () => {
    expect(shellGridClassName("auto")).toContain("motion-reduce:transition-none");
  });

  it("centers the sidebar grid with the header shell box", () => {
    expect(shellGridClassName("auto")).toContain("max-w-[1600px]");
    expect(shellGridClassName("auto")).toContain("mx-auto");
  });
});

describe("AppShell #view container", () => {
  it("centers page content with the shared shell view container", () => {
    expect(appShellSource).toContain('id="view"');
    expect(appShellSource).toContain("shellViewContainerClassName");
    expect(shellViewContainerClassName).toMatch(/max-w-\[1600px\]/);
  });
});
