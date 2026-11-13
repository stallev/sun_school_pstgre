import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { shellViewContainerClassName } from "@/lib/shell/shell-layout-classes";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "shell-header.client.tsx"),
  "utf8",
);

describe("ShellHeader layout (P-25)", () => {
  it("centers the header row in the same max-w 1600 shell box", () => {
    expect(source).toMatch(
      /mx-auto flex h-14 w-full max-w-\[1600px\][\s\S]*lg:px-0/,
    );
  });

  it("places sidebar toggle after the brand column", () => {
    const brandClose = source.indexOf("</CustomLink>");
    const toggleOpen = source.indexOf("<ShellSidebarToggle");
    expect(brandClose).toBeGreaterThan(-1);
    expect(toggleOpen).toBeGreaterThan(brandClose);
    expect(source.indexOf("<ShellSidebarToggle", brandClose)).toBe(toggleOpen);
  });

  it("defaults the brand column to rail on lg and 16rem from xl without a saved choice", () => {
    expect(source).toContain("lg:w-16 lg:justify-center lg:px-0 xl:w-64 xl:justify-start xl:px-5");
    expect(source).toContain("hidden lg:inline-flex xl:hidden");
    expect(source).toContain("shellGridClassName(sidebarPreference)");
  });

  it("keeps BrandMark visible in rail and aligns hdr right with #view padding", () => {
    expect(source).toContain("brandName={sidebarCollapsed ? undefined : messages.brand}");
    expect(source).not.toContain('sidebarCollapsed && "lg:hidden"');
    expect(source).toMatch(/ms-auto flex[\s\S]*lg:px-page[\s\S]*<UserMenu/);
    expect(source).not.toMatch(
      /lg:px-8[\s\S]*max-w-\[1600px\][\s\S]*<UserMenu/,
    );
    expect(source).not.toMatch(/justify-end gap-1\.5 px-4 sm:px-6/);
  });

  it("uses the shared view container constant in app shell, not nested hdr max-w", () => {
    expect(shellViewContainerClassName).toContain("px-page");
    expect(source).not.toContain("shellViewContainerClassName");
  });
});
